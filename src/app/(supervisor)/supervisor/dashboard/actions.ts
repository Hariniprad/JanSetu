'use server';

import { initializeFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function approveBeneficiary(ngoId: string, beneficiaryId: string) {
  try {
    const { firestore } = initializeFirebase();
    const beneficiaryRef = doc(firestore, 'ngos', ngoId, 'beneficiaries', beneficiaryId);
    await updateDoc(beneficiaryRef, { status: 'Approved' });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    // In a real app, you might want to log this error on the server
    console.error('Approval Error:', errorMessage);
    return { success: false, error: 'Failed to approve beneficiary.' };
  }
}

export async function rejectBeneficiary(ngoId: string, beneficiaryId: string) {
  try {
    const { firestore } = initializeFirebase();
    const beneficiaryRef = doc(firestore, 'ngos', ngoId, 'beneficiaries', beneficiaryId);
    await updateDoc(beneficiaryRef, { status: 'Rejected' });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    // In a real app, you might want to log this error on the server
    console.error('Rejection Error:', errorMessage);
    return { success: false, error: 'Failed to reject beneficiary.' };
  }
}
