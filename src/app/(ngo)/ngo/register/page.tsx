'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import {
  Camera,
  MapPin,
  Clock,
  Save,
  Loader2,
  RefreshCcw,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Mic,
  StopCircle,
  Play,
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, query, serverTimestamp, doc, getDocs } from 'firebase/firestore';
import { verifyFace } from '@/ai/flows/verify-face';
import { createVoiceProfile } from '@/ai/flows/create-voice-profile';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters long.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters long.',
  }),
  ageRange: z.string({
    required_error: 'Please select an age range.',
  }),
  gender: z.enum(['Male', 'Female', 'Other'], {
    required_error: 'You need to select a gender.',
  }),
});

type GpsLocation = {
  latitude: number;
  longitude: number;
};

type VerificationStatus = 'idle' | 'loading' | 'success' | 'error';


export default function RegisterBeneficiaryPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, profile } = useUser();

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<GpsLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [verificationMessage, setVerificationMessage] = useState('');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [voiceProfileId, setVoiceProfileId] = useState<string | null>(null);
  const [isEnrollingVoice, setIsEnrollingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    }
  });
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const getCameraPermission = async () => {
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
          description: 'Please enable camera and microphone permissions in your browser settings.',
        });
      }
    };

    if (isClient) {
      getCameraPermission();
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
        setVerificationMessage('');
      }
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    setVerificationStatus('idle');
    setVerificationMessage('');
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsFetchingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsFetchingLocation(false);
        toast({
            title: "Location Captured",
            description: "Your current GPS coordinates have been recorded."
        })
      },
      (error) => {
        setLocationError(`Error getting location: ${error.message}`);
        setIsFetchingLocation(false);
        toast({
            variant: "destructive",
            title: "Location Error",
            description: `Could not get your location. Please ensure location services are enabled.`,
        })
      }
    );
  };
  
  const handleVerifyFace = async () => {
    if (!capturedPhoto) {
      toast({ variant: 'destructive', title: 'No photo captured' });
      return;
    }
    if (!firestore || !profile?.ngoId) {
      toast({ variant: 'destructive', title: 'User or NGO data not available' });
      return;
    }

    setVerificationStatus('loading');
    setVerificationMessage('Fetching latest records...');

    try {
      // Step 1: Fetch a fresh, up-to-date list of beneficiaries right now.
      const beneficiariesRef = collection(firestore, 'ngos', profile.ngoId, 'beneficiaries');
      const querySnapshot = await getDocs(query(beneficiariesRef));
      const allBeneficiaries = querySnapshot.docs.map(doc => doc.data() as { photoUrl: string });
      
      const existingPhotos = allBeneficiaries.map(b => b.photoUrl).filter(Boolean);
      
      setVerificationMessage('Comparing face against existing records...');

      // Step 2: Pass the fresh list to the AI flow.
      const result = await verifyFace({ photoDataUri: capturedPhoto, existingPhotos });

      if (result.isDuplicate) {
        setVerificationStatus('error');
        setVerificationMessage(result.reason || 'This person appears to be already registered.');
        toast({
          variant: 'destructive',
          title: 'Duplicate Found',
          description: result.reason,
        });
      } else {
        setVerificationStatus('success');
        setVerificationMessage(result.reason || 'Verification successful. This appears to be a new person.');
        toast({
          title: 'Verification Complete',
          description: 'Face appears to be unique.',
        });
      }
    } catch (error) {
      console.error('Face verification error:', error);
      setVerificationStatus('error');
      setVerificationMessage('An error occurred during face verification. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'Could not complete face verification.',
      });
    }
  };


  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };
        
        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            setRecordedAudioUrl(audioUrl);
        };
        
        mediaRecorderRef.current.start();
        setIsRecording(true);
        setRecordedAudioUrl(null);
        setVoiceProfileId(null);
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

  const handleEnrollVoice = async () => {
    if (!recordedAudioUrl) {
      toast({ variant: 'destructive', title: 'No voice recording found.' });
      return;
    }

    setIsEnrollingVoice(true);
    setVoiceProfileId(null);
    
    try {
        // Convert blob URL to data URI
        const response = await fetch(recordedAudioUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            const result = await createVoiceProfile({ audioDataUri: base64Audio });
            
            setVoiceProfileId(result.voiceProfileId);
            toast({ title: 'Voice Enrolled', description: `Voice Profile ID: ${result.voiceProfileId}` });
            setIsEnrollingVoice(false);
        };
    } catch (error) {
        console.error('Voice enrollment error:', error);
        toast({ variant: 'destructive', title: 'Voice Enrollment Failed' });
        setIsEnrollingVoice(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!firestore || !profile?.ngoId || !user || !capturedPhoto || !gpsLocation || !voiceProfileId) {
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: "Missing required information. Please complete all fields, including voice enrollment.",
        });
        return;
    }
    if (verificationStatus !== 'success') {
      toast({
        variant: 'destructive',
        title: 'Submission Blocked',
        description: 'Please complete and pass face verification before submitting.',
      });
      return;
    }

    try {
        // Generate a secure, temporary random ID from Firestore to ensure uniqueness.
        const tempRef = doc(collection(firestore, 'ngos', profile.ngoId, 'beneficiaries'));
        // Create our desired ID format.
        const janSetuId = `JS-${tempRef.id.substring(0, 8).toUpperCase()}`;

        // Now create the final document reference with our custom ID.
        const newBeneficiaryRef = doc(firestore, 'ngos', profile.ngoId, 'beneficiaries', janSetuId);

        const newBeneficiary = {
            ...data,
            id: janSetuId, // Human-readable ID
            janSetuId: janSetuId, // Store it as a field as well for consistency
            ngoId: profile.ngoId,
            registrationWorkerId: user.uid,
            photoUrl: capturedPhoto,
            photoHint: 'woman portrait', // Placeholder hint
            gpsLocation: `${gpsLocation.latitude.toFixed(6)}, ${gpsLocation.longitude.toFixed(6)}`,
            timestamp: serverTimestamp(),
            status: 'Pending',
            registeredBy: profile.email,
            voiceProfileId: voiceProfileId,
            voiceConsent: recordedAudioUrl,
            location: `${gpsLocation.latitude.toFixed(4)}°, ${gpsLocation.longitude.toFixed(4)}°`,
            registeredAt: new Date(),
            qrCodeUrl: 'https://picsum.photos/seed/qrcode/200'
        };

        // Use setDocumentNonBlocking to create the document with our specified ID.
        setDocumentNonBlocking(newBeneficiaryRef, newBeneficiary, { merge: false });

        toast({
            title: "Registration Submitted!",
            description: `The beneficiary registration for ${janSetuId} is now pending supervisor approval.`,
        });

        form.reset();
        setCapturedPhoto(null);
        setGpsLocation(null);
        setVerificationStatus('idle');
        setVerificationMessage('');
        setRecordedAudioUrl(null);
        setVoiceProfileId(null);

    } catch (error) {
        console.error("Error submitting registration:", error);
        toast({
            variant: "destructive",
            title: "Submission Error",
            description: "An unexpected error occurred. Please try again.",
        });
    }
  };

  const getVerificationComponent = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Verifying...</AlertTitle>
            <AlertDescription>
              {verificationMessage}
            </AlertDescription>
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
        return (
           <Alert variant="default" className="border-blue-500 text-blue-700">
            <Shield className="h-4 w-4 text-blue-500" />
            <AlertTitle>Verification Required</AlertTitle>
            <AlertDescription>Click "Verify Face" to check for duplicates before submitting.</AlertDescription>
          </Alert>
        );
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Register New Beneficiary"
        description="Capture the required details to register a new person."
      />
      <canvas ref={canvasRef} className="hidden"></canvas>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Beneficiary Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beneficiary Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter the beneficiary's full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter a brief description of the beneficiary..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This will help supervisors identify the beneficiary.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ageRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age Range</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an age range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0-10">0-10 years</SelectItem>
                            <SelectItem value="11-20">11-20 years</SelectItem>
                            <SelectItem value="21-30">21-30 years</SelectItem>
                            <SelectItem value="31-40">31-40 years</SelectItem>
                            <SelectItem value="41-50">41-50 years</SelectItem>
                            <SelectItem value="51-60">51-60 years</SelectItem>
                            <SelectItem value="60+">60+ years</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Male" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Male
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Female" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Female
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Other" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Other
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Capture Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden relative">
                    {capturedPhoto ? (
                      <Image src={capturedPhoto} alt="Captured beneficiary" fill objectFit="cover" />
                    ) : (
                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    )}
                    {!capturedPhoto && hasCameraPermission && (
                       <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Button variant="secondary" type="button" onClick={handleCapturePhoto}>
                             <Camera className="mr-2 h-4 w-4" /> Capture Photo
                          </Button>
                       </div>
                    )}
                     {capturedPhoto && (
                       <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-2">
                          <Button variant="secondary" type="button" onClick={handleRetakePhoto}>
                             <RefreshCcw className="mr-2 h-4 w-4" /> Retake
                          </Button>
                          <Button variant="default" type="button" onClick={handleVerifyFace} disabled={verificationStatus === 'loading'}>
                            {verificationStatus === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                            Verify Face
                          </Button>
                       </div>
                    )}
                  </div>
                   {capturedPhoto && getVerificationComponent()}
                  {isClient && hasCameraPermission === false && (
                    <Alert variant="destructive">
                      <AlertTitle>Camera Access Required</AlertTitle>
                      <AlertDescription>
                        Please allow camera access to use this feature. Refresh the page after granting permission.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button variant="outline" type="button" className="w-full" onClick={handleGetLocation} disabled={isFetchingLocation}>
                    {isFetchingLocation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />} 
                    {gpsLocation ? `${gpsLocation.latitude.toFixed(4)}, ${gpsLocation.longitude.toFixed(4)}` : 'Get GPS Location'}
                  </Button>
                  {locationError && (
                     <Alert variant="destructive" className="text-xs">
                        <AlertDescription>
                          {locationError}
                        </AlertDescription>
                     </Alert>
                  )}
                  <div className="text-sm text-muted-foreground p-2 border rounded-lg flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>Timestamp will be automatically recorded upon submission.</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Voice Consent</CardTitle>
                  <CardDescription>Record a short phrase for voice identification.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isRecording ? (
                    <Button variant="outline" type="button" className="w-full" onClick={startRecording} disabled={isRecording}>
                      <Mic className="mr-2 h-4 w-4" /> Start Recording
                    </Button>
                  ) : (
                    <Button variant="destructive" type="button" className="w-full" onClick={stopRecording}>
                      <StopCircle className="mr-2 h-4 w-4" /> Stop Recording
                    </Button>
                  )}
                  {recordedAudioUrl && (
                    <div className="space-y-2">
                      <audio src={recordedAudioUrl} controls className="w-full" />
                       <Button variant="default" type="button" className="w-full" onClick={handleEnrollVoice} disabled={isEnrollingVoice || !!voiceProfileId}>
                        {isEnrollingVoice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                        {voiceProfileId ? 'Voice Enrolled' : 'Enroll Voice'}
                      </Button>
                    </div>
                  )}
                  {voiceProfileId && (
                     <Alert variant="default" className="border-green-500 text-green-700">
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                        <AlertTitle>Enrollment Successful</AlertTitle>
                        <AlertDescription>Voice profile created and linked.</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={!form.formState.isValid || !capturedPhoto || !gpsLocation || !voiceProfileId || form.formState.isSubmitting || verificationStatus !== 'success'}>
                <Save className="mr-2 h-4 w-4" />
                Submit Registration
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
    
    
