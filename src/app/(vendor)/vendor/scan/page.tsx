'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Camera, QrCode, ScanFace } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ScanPage() {
  const router = useRouter();
  const cameraPlaceholder = PlaceHolderImages.find(p => p.id === 'camera-placeholder');

  const handleScan = () => {
    // Simulate successful scan and redirect
    router.push('/beneficiary/JS-8435A');
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <PageHeader
        title="Verify Beneficiary"
        description="Scan a QR code or use face verification to confirm identity."
      />
      <Card>
        <CardHeader>
          <CardTitle>Scanner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden relative">
            {cameraPlaceholder && (
              <Image
                src={cameraPlaceholder.imageUrl}
                alt="Camera placeholder"
                fill
                className="object-cover"
                data-ai-hint={cameraPlaceholder.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-64 h-64 border-4 border-dashed border-white/50 rounded-lg animate-pulse" />
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                 <Button size="lg" onClick={handleScan}>
                    <Camera className="mr-2 h-4 w-4" /> Simulate Scan
                 </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary" size="lg" onClick={handleScan}>
              <QrCode className="mr-2 h-5 w-5" /> Scan QR Code
            </Button>
            <Button variant="secondary" size="lg" onClick={handleScan}>
              <ScanFace className="mr-2 h-5 w-5" /> Verify with Face
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
