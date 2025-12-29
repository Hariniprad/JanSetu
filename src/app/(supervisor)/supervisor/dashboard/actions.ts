'use server';

import { initializeFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

export async function approveBeneficiary(ngoId: string, beneficiaryId: string) {
  try {
    const { firestore } = initializeFirebase();
    const beneficiaryRef = doc(firestore, 'ngos', ngoId, 'beneficiaries', beneficiaryId);
    updateDocumentNonBlocking(beneficiaryRef, { status: 'Approved' });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}

export async function rejectBeneficiary(ngoId: string, beneficiaryId: string) {
  try {
    const { firestore } = initializeFirebase();
    const beneficiaryRef = doc(firestore, 'ngos', ngoId, 'beneficiaries', beneficiaryId);
    updateDocumentNonBlocking(beneficiaryRef, { status: 'Rejected' });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}
