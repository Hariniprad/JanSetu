'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLogo from '@/components/app-logo';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useUser, setDocumentNonBlocking, useFirestore } from '@/firebase';
import {
  initiateEmailSignIn,
  initiateEmailSignUp,
} from '@/firebase/non-blocking-login';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormMode = 'signin' | 'signup';
type UserRole = 'ngo' | 'supervisor' | 'vendor';

const MOCK_NGO_ID = 'mock-ngo-id';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const [mode, setMode] = useState<FormMode>('signin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState<UserRole>('ngo');
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const roleFromQuery = searchParams.get('role') as UserRole;
    if (['ngo', 'supervisor', 'vendor'].includes(roleFromQuery)) {
      setRole(roleFromQuery);
    }
  }, [searchParams]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
        if (isNewUser && firestore) {
            // This is a new user, create their profile
            const isNgoAssociated = role === 'ngo' || role === 'supervisor';
            const userProfile = {
                id: user.uid,
                email: user.email,
                role: role,
                ngoId: isNgoAssociated ? MOCK_NGO_ID : null,
            };
            const userDocRef = doc(firestore, 'users', user.uid);
            setDocumentNonBlocking(userDocRef, userProfile, { merge: true });

            // If the user is part of an NGO, ensure the mock NGO doc exists
            if (isNgoAssociated) {
                const ngoDocRef = doc(firestore, 'ngos', MOCK_NGO_ID);
                const ngoData = {
                    id: MOCK_NGO_ID,
                    name: "Mock Community Builders",
                    location: "Virtual"
                };
                // This will create the doc if it doesn't exist, or merge if it does.
                setDocumentNonBlocking(ngoDocRef, ngoData, { merge: true });
            }

            setIsNewUser(false); // Reset flag
        }

      toast({
        title: mode === 'signup' ? 'Sign Up Successful' : 'Login Successful',
        description: 'Redirecting you to your dashboard...',
      });
      
      let redirectPath = '/ngo/dashboard'; // Default
      switch (role) {
        case 'supervisor':
          redirectPath = '/supervisor/dashboard';
          break;
        case 'vendor':
          redirectPath = '/vendor/scan';
          break;
        case 'ngo':
        default:
          redirectPath = '/ngo/dashboard';
          break;
      }
      router.push(redirectPath);
    }
  }, [user, isUserLoading, router, toast, role, firestore, isNewUser, mode]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) return;
    setIsSubmitting(true);
    if (mode === 'signin') {
      initiateEmailSignIn(auth, values.email, values.password);
    } else {
      setIsNewUser(true); // Set flag to indicate a new user is being created
      initiateEmailSignUp(auth, values.email, values.password);
    }
    // The useEffect will handle redirection on successful login.
    // We can add a timeout to reset submission state in case of error
    setTimeout(() => setIsSubmitting(false), 5000); // Reset after 5s
  }

  const toggleMode = () => {
    setMode(prevMode => (prevMode === 'signin' ? 'signup' : 'signin'));
    form.reset();
  };

  const title = mode === 'signin' ? 'Welcome Back' : 'Create an Account';
  const description = `Sign in as a ${role}.`;
  const buttonText = mode === 'signin' ? 'Sign In' : 'Sign Up';
  const toggleLinkText = mode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/30">
      <Link href="/" className="absolute top-4 left-4">
        <Button variant="outline">&larr; Back to Role Selection</Button>
      </Link>
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in-50 zoom-in-95 duration-500">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AppLogo className="text-4xl" />
          </div>
          <CardTitle className="font-headline text-2xl">
            {title}
          </CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting || isUserLoading}>
                {(isSubmitting || isUserLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {buttonText}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center">
            <Button variant="link" onClick={toggleMode}>
              {toggleLinkText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginPageContent />
        </Suspense>
    )
}
