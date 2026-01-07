'use client';

import Image from 'next/image';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, User, MapPin, Clock, Loader2, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useCollection, useFirestore, useUser, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { useState } from 'react';
import { collection, query, where, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type Beneficiary = {
  id: string;
  name: string;
  description: string;
  photoUrl: string;
  photoHint: string;
  location: string;
  ageRange: string;
  gender: 'Male' | 'Female' | 'Other';
  registeredBy: string;
  registeredAt: { seconds: number; nanoseconds: number };
  status: 'Pending' | 'Approved' | 'Rejected';
  qrCodeUrl: string;
};

export default function SupervisorDashboard() {
  const { user, profile, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isSupervisor = profile?.role === 'supervisor';
  const ngoId = profile?.ngoId;

  const beneficiariesQuery = useMemoFirebase(() => {
    // Only create a query if the user is a supervisor and has an NGO ID
    if (!firestore || !isSupervisor || !ngoId) return null;
    return query(
      collection(firestore, 'ngos', ngoId, 'beneficiaries'),
      where('status', '==', 'Pending')
    );
  }, [firestore, isSupervisor, ngoId]);

  const { data: pendingApprovals, isLoading: isLoadingBeneficiaries } = useCollection<Beneficiary>(beneficiariesQuery);
  
  const isLoading = isUserLoading || isLoadingBeneficiaries;

  const handleApprove = (beneficiaryId: string) => {
    if (!ngoId || !firestore) return;
    setUpdatingId(beneficiaryId);
    const beneficiaryRef = doc(firestore, 'ngos', ngoId, 'beneficiaries', beneficiaryId);
    updateDocumentNonBlocking(beneficiaryRef, { status: 'Approved' });
    toast({ title: 'Beneficiary Approved', description: 'The beneficiary is now active.' });
    // Optimistic UI update will be handled by the real-time listener.
    // We can set updatingId to null after a short delay to give time for the UI to update.
    setTimeout(() => setUpdatingId(null), 1000);
  };

  const handleReject = (beneficiaryId: string) => {
    if (!ngoId || !firestore) return;
    setUpdatingId(beneficiaryId);
    const beneficiaryRef = doc(firestore, 'ngos', ngoId, 'beneficiaries', beneficiaryId);
    updateDocumentNonBlocking(beneficiaryRef, { status: 'Rejected' });
    toast({ title: 'Beneficiary Rejected' });
    setTimeout(() => setUpdatingId(null), 1000);
  };

  const getRegisteredAtDate = (registeredAt: any) => {
    if (registeredAt?.seconds) {
      return new Date(registeredAt.seconds * 1000);
    }
    return new Date();
  }
  
  if (!isUserLoading && !isSupervisor) {
    return (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <CardHeader>
                <div className="mx-auto bg-destructive/10 p-4 rounded-full">
                    <ShieldAlert className="h-12 w-12 text-destructive" />
                </div>
                <CardTitle className="font-headline text-2xl mt-4">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">You do not have permission to view this page. Please log in as a supervisor.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pending Approvals"
        description={
          isLoading
            ? 'Loading registrations...'
            : `You have ${pendingApprovals?.length || 0} new registrations to review.`
        }
      />

      {isLoading && (
         <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="flex flex-col">
                    <CardHeader>
                        <Skeleton className="aspect-video w-full" />
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <Skeleton className="w-3/4 h-8" />
                        <Skeleton className="w-full h-4" />
                        <Skeleton className="w-full h-4" />
                        <div className="space-y-2 pt-2 border-t">
                            <Skeleton className="w-1/2 h-4" />
                            <Skeleton className="w-2/3 h-4" />
                            <Skeleton className="w-3/4 h-4" />
                        </div>
                    </CardContent>
                    <CardFooter className="grid grid-cols-2 gap-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardFooter>
                </Card>
            ))}
         </div>
      )}
      
      {!isLoading && pendingApprovals?.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <CardHeader>
                <CardTitle className="font-headline">All Clear!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">There are no pending registrations at the moment.</p>
            </CardContent>
        </Card>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {pendingApprovals?.map((beneficiary) => (
          <Card key={beneficiary.id} className="flex flex-col">
            <CardHeader>
              <div className="aspect-video relative rounded-lg overflow-hidden -mt-2 -mx-2">
                <Image
                  alt={beneficiary.name}
                  className="object-cover"
                  src={beneficiary.photoUrl}
                  fill
                  data-ai-hint={beneficiary.photoHint}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <CardTitle className="font-headline text-xl">{beneficiary.name}</CardTitle>
              <p className="text-sm text-muted-foreground italic">"{beneficiary.description}"</p>
              <div className="text-sm text-muted-foreground space-y-2 pt-2 border-t">
                 <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Registered by: <strong>{beneficiary.registeredBy}</strong></span>
                 </div>
                 <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Location: {beneficiary.location}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Submitted {formatDistanceToNow(getRegisteredAtDate(beneficiary.registeredAt), { addSuffix: true })}</span>
                 </div>
              </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => handleReject(beneficiary.id)} disabled={updatingId === beneficiary.id}>
                {updatingId === beneficiary.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />} 
                Reject
              </Button>
              <Button onClick={() => handleApprove(beneficiary.id)} disabled={updatingId === beneficiary.id}>
                {updatingId === beneficiary.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Approve
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
