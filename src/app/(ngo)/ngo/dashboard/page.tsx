'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { ArrowRight, UserPlus, List } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

type Beneficiary = {
  id: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};

const quickLinks = [
    {
        title: 'Register New Beneficiary',
        description: 'Start a new registration form.',
        href: '/ngo/register',
        icon: <UserPlus className="h-6 w-6 text-primary" />,
    },
    {
        title: 'View My Registrations',
        description: 'See the status of all your registrations.',
        href: '/ngo/my-registrations',
        icon: <List className="h-6 w-6 text-primary" />,
    },
]

export default function NgoDashboard() {
    const { user, profile } = useUser();
    const firestore = useFirestore();

    const myRegistrationsQuery = useMemoFirebase(() => {
        if (!firestore || !user || !profile?.ngoId) return null;
        return query(
          collection(firestore, 'ngos', profile.ngoId, 'beneficiaries'),
          where('registrationWorkerId', '==', user.uid)
        );
    }, [firestore, user, profile?.ngoId]);

    const { data: myRegistrations, isLoading } = useCollection<Beneficiary>(myRegistrationsQuery);

    const stats = {
        myRegistrations: myRegistrations?.length ?? 0,
        pendingApproval: myRegistrations?.filter(b => b.status === 'Pending').length ?? 0,
        totalApproved: myRegistrations?.filter(b => b.status === 'Approved').length ?? 0,
    };

  return (
    <div className="space-y-8">
      <PageHeader title="Welcome, Ravi!" description="Here's a summary of your activities." />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Registrations</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold">{stats.myRegistrations}</div>}
                <p className="text-xs text-muted-foreground">Total beneficiaries registered</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold">{stats.pendingApproval}</div>}
                <p className="text-xs text-muted-foreground">Waiting for supervisor review</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Approved</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold">{stats.totalApproved}</div>}
                <p className="text-xs text-muted-foreground">Successfully onboarded</p>
            </CardContent>
        </Card>
      </div>
      
      <div>
        <h2 className="text-xl font-headline font-bold mb-4">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-2">
            {quickLinks.map(link => (
                <Link href={link.href} key={link.title}>
                    <Card className="hover:bg-card/90 hover:shadow-md transition-all">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">{link.icon}</div>
                            <div className="flex-1">
                                <CardTitle className="text-lg font-semibold">{link.title}</CardTitle>
                                <CardDescription>{link.description}</CardDescription>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                    </Card>
                </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
