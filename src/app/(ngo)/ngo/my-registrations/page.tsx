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
import { mockBeneficiaries } from '@/lib/mock-data';
import { format } from 'date-fns';

export default function MyRegistrationsPage() {
  const myRegistrations = mockBeneficiaries.filter(
    (b) => b.registeredBy === 'Ravi Kumar'
  );

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
            You have registered {myRegistrations.length} beneficiaries.
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
              {myRegistrations.map((beneficiary) => (
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
                    {format(beneficiary.registeredAt, 'PPP')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
