'use client';

import { notFound, useSearchParams, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { CheckCircle, ShieldCheck, XCircle, Loader2, Mic } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type Beneficiary = {
  id: string; // This is the human-readable JanSetu ID
  name: string;
  description: string;
  photoUrl: string;
  photoHint: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  qrCodeUrl: string;
  voiceProfileId?: string;
};


function BeneficiaryStatusCard({ beneficiary }: { beneficiary: Beneficiary }) {
    const isApproved = beneficiary.status === 'Approved';
    const statusIcon = isApproved ? (
      <CheckCircle className="h-16 w-16 text-green-500" />
    ) : (
      <XCircle className="h-16 w-16 text-destructive" />
    );
    const statusTitle = isApproved ? 'Beneficiary Verified' : 'Beneficiary Not Active';
    const statusBadge = isApproved ? (
        <Badge className="text-lg py-2 px-4 bg-green-500 hover:bg-green-600 text-white">
            ACTIVE
        </Badge>
    ) : (
        <Badge variant="destructive" className="text-lg py-2 px-4">
            {beneficiary.status.toUpperCase()}
        </Badge>
    );

    return (
        <Card className="w-full max-w-md text-center shadow-2xl animate-in fade-in-50 zoom-in-95 duration-500">
            <CardHeader>
                <div className="flex justify-center">{statusIcon}</div>
                <CardTitle className="font-headline text-2xl mt-4">{statusTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg">
                    <Image
                        src={beneficiary.photoUrl}
                        alt={`Photo of ${beneficiary.name}`}
                        fill
                        className="object-cover"
                        data-ai-hint={beneficiary.photoHint}
                    />
                </div>

                <div className="space-y-1">
                    <h2 className="text-xl font-bold">{beneficiary.name}</h2>
                    <p className="text-muted-foreground">{beneficiary.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    <Card className="bg-card/50">
                        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">JanSetu ID</CardTitle>
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-mono font-bold">{beneficiary.id}</div>
                        </CardContent>
                    </Card>
                     <Card className="bg-card/50">
                        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Voice ID</CardTitle>
                            <Mic className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm font-mono font-bold truncate" title={beneficiary.voiceProfileId}>
                                {beneficiary.voiceProfileId || 'Not Enrolled'}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {statusBadge}
            </CardContent>
        </Card>
    )
}

function BeneficiaryLoadingSkeleton() {
    return (
        <Card className="w-full max-w-md text-center shadow-2xl">
             <CardHeader>
                <div className="flex justify-center">
                    <Loader2 className="h-16 w-16 text-muted-foreground animate-spin" />
                </div>
                <CardTitle className="font-headline text-2xl mt-4">Loading Beneficiary...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                 <Skeleton className="w-48 h-48 mx-auto rounded-full" />
                 <div className="space-y-2">
                    <Skeleton className="h-7 w-2/3 mx-auto" />
                    <Skeleton className="h-4 w-full mx-auto" />
                 </div>
                 <Skeleton className="h-20 w-full" />
                 <Skeleton className="h-10 w-24 mx-auto" />
            </CardContent>
        </Card>
    )
}


export default function BeneficiaryActivePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const firestore = useFirestore();

  // The 'id' from params is now the document ID.
  const beneficiaryDocId = Array.isArray(params.id) ? params.id[0] : params.id;
  const ngoId = searchParams.get('ngoId');

  const beneficiaryRef = useMemoFirebase(() => {
    if (!firestore || !beneficiaryDocId || !ngoId) return null;
    // Construct the direct path to the document.
    return doc(firestore, 'ngos', ngoId, 'beneficiaries', beneficiaryDocId);
  }, [firestore, beneficiaryDocId, ngoId]);

  const { data: beneficiary, isLoading, error } = useDoc<Beneficiary>(beneficiaryRef);

  if (isLoading) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/30">
             <div className="absolute top-4 left-4">
                <AppLogo className="text-3xl" />
            </div>
            <BeneficiaryLoadingSkeleton />
        </main>
    )
  }

  if (error || !beneficiary) {
    // This will trigger if the ngoId is missing, the doc ID is wrong, or a permissions error occurs.
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/30">
        <div className="absolute top-4 left-4">
            <AppLogo className="text-3xl" />
        </div>
        <BeneficiaryStatusCard beneficiary={beneficiary} />
    </main>
  );
}
