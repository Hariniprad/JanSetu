
'use client';

import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Clock, Map } from 'lucide-react';
import { useState, useEffect } from 'react';

type Beneficiary = {
  id: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  location: string;
};

function StatCard({ title, value, icon, isLoading }: { title: string; value: number | string; icon: React.ReactNode; isLoading: boolean; }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="text-muted-foreground">{icon}</div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                ) : (
                    <div className="text-2xl font-bold">{value}</div>
                )}
            </CardContent>
        </Card>
    )
}


export default function PublicDashboardPage() {
  const firestore = useFirestore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const approvedQuery = useMemoFirebase(() => {
    if (!firestore || !isClient) return null;
    return query(
      collectionGroup(firestore, 'beneficiaries'),
      where('status', '==', 'Approved')
    );
  }, [firestore, isClient]);

  const pendingQuery = useMemoFirebase(() => {
    if (!firestore || !isClient) return null;
    return query(
      collectionGroup(firestore, 'beneficiaries'),
      where('status', '==', 'Pending')
    );
  }, [firestore, isClient]);

  const {
    data: approvedBeneficiaries,
    isLoading: isLoadingApproved,
  } = useCollection<Beneficiary>(approvedQuery);

  const {
    data: pendingBeneficiaries,
    isLoading: isLoadingPending,
  } = useCollection<Beneficiary>(pendingQuery);

  const isLoading = !isClient || isLoadingApproved || isLoadingPending;

  const stats = {
    approved: approvedBeneficiaries?.length ?? 0,
    pending: pendingBeneficiaries?.length ?? 0,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Public Dashboard"
        description="A transparent overview of the JanSetu project's impact and progress."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
            title="Approved Beneficiaries"
            value={stats.approved}
            isLoading={isLoading}
            icon={<CheckCircle className="h-4 w-4" />}
        />
        <StatCard 
            title="Pending Approvals"
            value={stats.pending}
            isLoading={isLoading}
            icon={<Clock className="h-4 w-4" />}
        />
        <div className="hidden lg:block lg:col-span-2"></div>
      </div>

      <div className="grid gap-4">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
            <CardDescription>
              Visualization of beneficiary locations across all regions.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px] w-full flex items-center justify-center bg-muted/50 rounded-lg">
                <div className="text-center text-muted-foreground">
                    <Map className="h-12 w-12 mx-auto mb-2" />
                    <p className="font-semibold">Map Placeholder</p>
                    <p className="text-sm">An interactive map will be implemented here soon.</p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
