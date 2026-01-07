'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { useDoc } from './firestore/use-doc';

// Define the shape of the user profile document stored in Firestore
interface UserProfile {
  id: string;
  email: string;
  role: 'ngo' | 'supervisor' | 'vendor' | string; // Be flexible with role string
  ngoId?: string;
  // Add other profile fields as needed
}

// Internal state for user authentication and profile
interface UserAuthState {
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  // User authentication and profile state
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean; // True during initial auth check and profile fetch
  userError: Error | null; // Error from auth listener or profile fetch
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state and profile
export interface UserHookResult {
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);


/**
 * A hook to fetch user profile data from Firestore.
 * @param firestore - The Firestore instance.
 * @param user - The authenticated user object from Firebase Auth.
 * @returns The user's profile data, loading state, and any error.
 */
function useUserProfile(firestore: Firestore | null, user: User | null) {
  const userProfileRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile, isLoading, error } = useDoc<UserProfile>(userProfileRef);

  return { profile, isLoading, error };
}


/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<Omit<UserAuthState, 'profile'>>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Fetch the user's profile from Firestore using our new hook
  const { profile, isLoading: isProfileLoading, error: profileError } = useUserProfile(firestore, userAuthState.user);


  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) { // If no Auth service instance, cannot determine user state
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    setUserAuthState({ user: null, isUserLoading: true, userError: null }); // Reset on auth instance change

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => { // Auth state determined
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => { // Auth listener error
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe(); // Cleanup
  }, [auth]); // Depends on the auth instance

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    const isLoading = userAuthState.isUserLoading || (!!userAuthState.user && isProfileLoading);
    const combinedError = userAuthState.userError || profileError;

    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      profile: profile,
      isUserLoading: isLoading,
      userError: combinedError,
    };
  }, [firebaseApp, firestore, auth, userAuthState, profile, isProfileLoading, profileError]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    profile: context.profile,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state, including their profile.
 * This provides the User object, profile data, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, profile, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const { user, profile, isUserLoading, userError } = useFirebase();
  return { user, profile, isUserLoading, userError };
};
