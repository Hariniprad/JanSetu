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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import {
  Camera,
  MapPin,
  Clock,
  Mic,
  Save,
  Loader2,
  RefreshCcw,
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
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

export default function RegisterBeneficiaryPage() {
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(true);
  const [isClient, setIsClient] = useState(false);

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<GpsLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
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
      }
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
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


  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // This is the final submission logic
    toast({
        title: "Registration Submitted!",
        description: "The beneficiary registration is now pending supervisor approval.",
    });
    form.reset();
    setCapturedPhoto(null);
    setGpsLocation(null);
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
                  <CardDescription>
                    Fill in the details of the beneficiary.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                      <Image src={capturedPhoto} alt="Captured beneficiary" layout="fill" objectFit="cover" />
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
                       <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Button variant="secondary" type="button" onClick={handleRetakePhoto}>
                             <RefreshCcw className="mr-2 h-4 w-4" /> Retake Photo
                          </Button>
                       </div>
                    )}
                  </div>
                  { !hasCameraPermission && isClient && (
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
                  <Button variant="outline" type="button" className="w-full">
                    <Mic className="mr-2 h-4 w-4" /> Record Voice Consent
                  </Button>
                  <div className="text-sm text-muted-foreground p-2 border rounded-lg flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>Timestamp will be automatically recorded upon submission.</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={!form.formState.isValid || !capturedPhoto || !gpsLocation || form.formState.isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                Submit Registration
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
