import { mockBeneficiaries } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { CheckCircle, ShieldCheck } from 'lucide-react';
import AppLogo from '@/components/app-logo';

export default function BeneficiaryActivePage({ params }: { params: { id: string } }) {
  const beneficiary = mockBeneficiaries.find(b => b.id === params.id && b.status === 'Approved');

  if (!beneficiary) {
    // In a real app, you might show a "Not Found or Not Active" page
    // For this mock, we just show a simple not found.
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/30">
        <div className="absolute top-4 left-4">
            <AppLogo className="text-3xl" />
        </div>
        <Card className="w-full max-w-md text-center shadow-2xl animate-in fade-in-50 zoom-in-95 duration-500">
            <CardHeader>
                <div className="flex justify-center">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <CardTitle className="font-headline text-2xl mt-4">Beneficiary Verified</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="relative w-48 h-48 mx-auto rounded-lg overflow-hidden border-4 border-white shadow-lg">
                     <Image
                        src={beneficiary.qrCodeUrl}
                        alt={`QR Code for ${beneficiary.name}`}
                        fill
                        className="object-cover"
                        data-ai-hint="qr code"
                     />
                </div>

                <div className="space-y-1">
                    <h2 className="text-xl font-bold">{beneficiary.name}</h2>
                    <p className="text-muted-foreground">{beneficiary.description}</p>
                </div>

                <Card className="bg-card/50 text-left">
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">JanSetu ID</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-mono font-bold">{beneficiary.id}</div>
                    </CardContent>
                </Card>

                <Badge className="text-lg py-2 px-4 bg-green-500 hover:bg-green-600 text-white">
                    ACTIVE
                </Badge>
            </CardContent>
        </Card>
    </main>
  );
}
