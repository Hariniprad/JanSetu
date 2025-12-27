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
import { mockBeneficiaries } from '@/lib/mock-data';
import { Check, X, User, MapPin, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SupervisorDashboard() {
  const pendingApprovals = mockBeneficiaries.filter(
    (b) => b.status === 'Pending'
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pending Approvals"
        description={`You have ${pendingApprovals.length} new registrations to review.`}
      />
      
      {pendingApprovals.length === 0 ? (
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
        {pendingApprovals.map((beneficiary) => (
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
                    <span>Submitted {formatDistanceToNow(beneficiary.registeredAt, { addSuffix: true })}</span>
                 </div>
              </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2">
              <Button variant="outline">
                <X className="mr-2 h-4 w-4" /> Reject
              </Button>
              <Button>
                <Check className="mr-2 h-4 w-4" /> Approve
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
