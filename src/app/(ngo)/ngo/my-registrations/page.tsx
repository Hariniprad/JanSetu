'use client';

import Image from 'next/image';
import { PageHeader } from '@/components/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type Beneficiary = {
  id: string;
  name: string;
  photoUrl: string;
  photoHint: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  location: string;
  registeredAt: { seconds: number, nanoseconds: number };
};

export default function MyRegistrationsPage() {
  const { user, profile } = useUser();
  const firestore = useFirestore();

  const myRegistrationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'ngos', profile?.ngoId || '', 'beneficiaries'),
      where('registrationWorkerId', '==', user.uid)
    );
  }, [firestore, user, profile?.ngoId]);

  const { data: myRegistrations, isLoading } = useCollection<Beneficiary>(myRegistrationsQuery);

  const statusVariant = (status: 'Pending' | 'Approved' | 'Rejected'): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
        case 'Approved':
            return 'default';
        case 'Pending':
            return 'secondary';
        case 'Rejected':
            return 'destructive';
    }
  }

  const getRegisteredAtDate = (registeredAt: any) => {
    if (registeredAt?.seconds) {
      return new Date(registeredAt.seconds * 1000);
    }
    // Fallback for data that might not have a timestamp yet
    if (registeredAt instanceof Date) {
      return registeredAt;
    }
    return new Date();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Registrations"
        description="A list of all the beneficiaries you have registered."
      />

      <Card>
        <CardHeader>
          <CardTitle>Beneficiary List</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading your registrations...' : `You have registered ${myRegistrations?.length || 0} beneficiaries.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Beneficiary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">
                  Location
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Registered On
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="hidden sm:table-cell">
                        <Skeleton className="aspect-square rounded-md w-[64px] h-[64px]" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-5 w-2/3 mb-1" />
                        <Skeleton className="h-4 w-1/3" />
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : myRegistrations?.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No registrations found.
                    </TableCell>
                </TableRow>
              ) : (
                myRegistrations?.map((beneficiary) => (
                  <TableRow key={beneficiary.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        alt={beneficiary.name}
                        className="aspect-square rounded-md object-cover"
                        height="64"
                        src={beneficiary.photoUrl}
                        width="64"
                        data-ai-hint={beneficiary.photoHint}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="font-bold">{beneficiary.name}</div>
                      <div className="text-sm text-muted-foreground">{beneficiary.id}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(beneficiary.status)}>
                        {beneficiary.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {beneficiary.location}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(getRegisteredAtDate(beneficiary.registeredAt), 'PPP')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
