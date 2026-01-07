'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Camera,
  ScanFace,
  RefreshCcw,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Mic,
  StopCircle,
  ScanLine,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { verifyBeneficiaryFace } from '@/ai/flows/verify-beneficiary-face';
import { identifySpeaker } from '@/ai/flows/identify-speaker';
import { Input } from '@/components/ui/input';

type VerificationMode = 'face' | 'voice' | 'idle';
type VerificationStatus = 'idle' | 'loading' | 'success' | 'error';
type Beneficiary = {
  docId: string; // The actual Firestore Document ID
  id: string; // The human-readable JanSetu ID
  photoUrl: string;
  voiceProfileId?: string;
  [key: string]: any;
};

export default function ScanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | undefined
  >(undefined);
  const [isClient, setIsClient] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [beneficiaryId, setBeneficiaryId] = useState('');
  
  const [verificationMode, setVerificationMode] = useState<VerificationMode>('idle');
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>('idle');
  const [verificationMessage, setVerificationMessage] = useState('');

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const getPermissions = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Media Access Denied',
          description:
            'Please enable camera and microphone permissions in your browser settings.',
        });
      }
    };

    if (isClient) {
      getPermissions();
    }
  }, [isClient, toast]);

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUri = canvas.toDataURL('image/jpeg');
        setCapturedPhoto(dataUri);
        setVerificationStatus('idle');
      }
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    setVerificationStatus('idle');
  };

  const handleFaceVerify = async () => {
    if (!capturedPhoto || !beneficiaryId) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please capture a photo and enter a Beneficiary ID.',
      });
      return;
    }
    setVerificationMode('face');
    setVerificationStatus('loading');
    setVerificationMessage('Searching for beneficiary...');

    try {
      const { beneficiary, ngoId } = await findBeneficiary(beneficiaryId);
      
      setVerificationMessage(`Beneficiary ${beneficiary.id} found. Verifying face...`);

      const result = await verifyBeneficiaryFace({
        livePhotoDataUri: capturedPhoto,
        registeredPhotoUrl: beneficiary.photoUrl,
      });

      if (result.isMatch) {
        setVerificationStatus('success');
        setVerificationMessage(result.reason);
        toast({
          title: 'Face Verification Successful!',
          description: `Redirecting to beneficiary ${beneficiary.id}...`,
        });
        router.push(`/beneficiary/${beneficiary.docId}?ngoId=${ngoId}`);
      } else {
        throw new Error(result.reason || 'Live photo does not match the registered beneficiary.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setVerificationStatus('error');
      setVerificationMessage(errorMessage);
    }
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            setRecordedAudioUrl(audioUrl);
            handleVoiceVerify(audioUrl);
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
        setRecordedAudioUrl(null);
    } catch (err) {
        toast({ variant: 'destructive', title: 'Microphone access denied.' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  const handleVoiceVerify = async (audioUrl: string) => {
    if (!firestore) return;
    setVerificationMode('voice');
    setVerificationStatus('loading');
    setVerificationMessage('Processing voice...');

    try {
      const ngosQuery = query(collection(firestore, 'ngos'));
      const ngoDocsSnapshot = await getDocs(ngosQuery);
      
      let allApprovedBeneficiaries: Beneficiary[] = [];

      for (const ngoDoc of ngoDocsSnapshot.docs) {
        const beneficiariesCollectionRef = collection(firestore, 'ngos', ngoDoc.id, 'beneficiaries');
        const beneficiaryQuery = query(beneficiariesCollectionRef, where('status', '==', 'Approved'));
        const beneficiaryQuerySnapshot = await getDocs(beneficiaryQuery);
        
        beneficiaryQuerySnapshot.forEach(doc => {
          allApprovedBeneficiaries.push({ ...doc.data(), docId: doc.id } as Beneficiary);
        });
      }

      const candidateProfileIds = allApprovedBeneficiaries
        .map(b => b.voiceProfileId)
        .filter((id): id is string => !!id);

      if (candidateProfileIds.length === 0) {
        throw new Error("No enrolled voice profiles found in the system.");
      }

      setVerificationMessage("Comparing voice against enrolled beneficiaries...");

      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          const result = await identifySpeaker({ 
              audioDataUri: base64Audio, 
              candidateProfileIds 
          });

          if (result.isMatch && result.voiceProfileId) {
            const matchedBeneficiary = allApprovedBeneficiaries.find(b => b.voiceProfileId === result.voiceProfileId);
            if(matchedBeneficiary) {
              const matchedNgoId = allApprovedBeneficiaries.find(b => b.docId === matchedBeneficiary.docId)?.ngoId;
              setVerificationStatus('success');
              setVerificationMessage(`Voice match found: ${matchedBeneficiary.name}`);
              toast({ title: 'Voice Verification Successful!', description: `Redirecting to beneficiary ${matchedBeneficiary.id}...` });
              router.push(`/beneficiary/${matchedBeneficiary.docId}?ngoId=${matchedNgoId}`);
            } else {
              throw new Error("Match found but could not link to a beneficiary.");
            }
          } else {
            throw new Error(result.reason || "Could not identify speaker from voice.");
          }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setVerificationStatus('error');
      setVerificationMessage(errorMessage);
    }
  };
  
  const findBeneficiary = async (id: string): Promise<{ beneficiary: Beneficiary, ngoId: string }> => {
    if (!firestore) throw new Error("Firestore is not available.");

    const ngosQuery = query(collection(firestore, 'ngos'));
    const ngoDocsSnapshot = await getDocs(ngosQuery);
    
    if (ngoDocsSnapshot.empty) {
      throw new Error('No NGOs found in the system.');
    }
    
    for (const ngoDoc of ngoDocsSnapshot.docs) {
      const beneficiariesCollectionRef = collection(firestore, 'ngos', ngoDoc.id, 'beneficiaries');
      const beneficiaryQuery = query(beneficiariesCollectionRef, where('janSetuId', '==', id));
      const beneficiaryQuerySnapshot = await getDocs(beneficiaryQuery);

      if (!beneficiaryQuerySnapshot.empty) {
        const beneficiaryDoc = beneficiaryQuerySnapshot.docs[0];
        const data = beneficiaryDoc.data();
        if (data.status === 'Approved') {
          return {
            beneficiary: { ...data, docId: beneficiaryDoc.id } as Beneficiary,
            ngoId: ngoDoc.id
          };
        } else {
           throw new Error('Beneficiary found but is not approved.');
        }
      }
    }

    throw new Error('Beneficiary not found or is not approved.');
  }
  
  const getVerificationComponent = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Verifying...</AlertTitle>
            <AlertDescription>{verificationMessage}</AlertDescription>
          </Alert>
        );
      case 'success':
        return (
          <Alert variant="default" className="border-green-500 text-green-700">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <AlertTitle>Verification Successful</AlertTitle>
            <AlertDescription>{verificationMessage}</AlertDescription>
          </Alert>
        );
      case 'error':
        return (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Verification Failed</AlertTitle>
            <AlertDescription>{verificationMessage}</AlertDescription>
          </Alert>
        );
      case 'idle':
      default:
        return null;
    }
  };


  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <PageHeader
        title="Verify Beneficiary"
        description="Verify beneficiary identity using Face, Voice, or ID."
      />
      <canvas ref={canvasRef} className="hidden"></canvas>
      <Card>
        <CardHeader>
          <CardTitle>Scanner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden relative">
            {capturedPhoto ? (
              <Image
                src={capturedPhoto}
                alt="Captured for verification"
                fill
                objectFit="cover"
              />
            ) : (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
            )}

            {hasCameraPermission && !capturedPhoto && !isRecording && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleCapturePhoto}
                >
                  <Camera className="mr-2 h-4 w-4" /> Capture Photo
                </Button>
              </div>
            )}
             {hasCameraPermission && isRecording && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                    <Mic className="h-8 w-8 animate-pulse" />
                    <p className="mt-2 text-lg font-semibold">Recording...</p>
                </div>
            )}
            {capturedPhoto && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleRetakePhoto}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" /> Retake Photo
                </Button>
              </div>
            )}
          </div>
          {isClient && hasCameraPermission === false && (
            <Alert variant="destructive">
              <AlertTitle>Media Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera and microphone access to use this feature.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Input 
                placeholder="Enter Beneficiary ID for Face Scan"
                value={beneficiaryId}
                onChange={(e) => setBeneficiaryId(e.target.value)}
                disabled={!capturedPhoto || verificationStatus === 'loading'}
            />
          </div>

          <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
             <Button
              variant="default"
              size="lg"
              className="w-full"
              onClick={handleFaceVerify}
              disabled={!capturedPhoto || !beneficiaryId || verificationStatus === 'loading'}
            >
              {verificationMode === 'face' && verificationStatus === 'loading' ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <ScanFace className="mr-2 h-5 w-5" />
              )}
              Verify with Face
            </Button>
            
            {!isRecording ? (
                <Button variant="secondary" size="lg" className="w-full" onClick={startRecording} disabled={verificationStatus === 'loading'}>
                    <Mic className="mr-2 h-5 w-5"/> Verify with Voice
                </Button>
            ) : (
                <Button variant="destructive" size="lg" className="w-full" onClick={stopRecording}>
                    <StopCircle className="mr-2 h-5 w-5"/> Stop Recording
                </Button>
            )}
          </div>
          <div className="pt-2">{getVerificationComponent()}</div>
        </CardContent>
      </Card>
    </div>
  );
}
