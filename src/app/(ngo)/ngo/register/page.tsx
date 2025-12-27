'use client';

import { useForm, useFormState } from 'react-hook-form';
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
  Wand2,
} from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { generateDescriptionAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef, useState } from 'react';

const formSchema = z.object({
  ageRange: z.string({
    required_error: 'Please select an age range.',
  }),
  gender: z.enum(['Male', 'Female', 'Other'], {
    required_error: 'You need to select a gender.',
  }),
});

export default function RegisterBeneficiaryPage() {
  const { toast } = useToast();
  const [generatedDescription, setGeneratedDescription] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // This is the final submission logic
    toast({
        title: "Registration Submitted!",
        description: "The beneficiary registration is now pending supervisor approval.",
    });
    form.reset();
    setGeneratedDescription(null);
  };
  
  const handleGenerateDescription = async () => {
    const valid = await form.trigger();
    if (!valid || !formRef.current) return;
    
    setIsGenerating(true);
    setGeneratedDescription(null);

    const formData = new FormData(formRef.current);
    const result = await generateDescriptionAction(formData);

    setIsGenerating(false);

    if (result.success && result.description) {
        setGeneratedDescription(result.description);
        toast({
            title: "Description Generated",
            description: "AI has generated a short description for this beneficiary."
        });
    } else {
        toast({
            variant: "destructive",
            title: "Generation Failed",
            description: result.error || "Could not generate a description.",
        });
    }
  }

  const cameraPlaceholder = PlaceHolderImages.find(p => p.id === 'camera-placeholder');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Register New Beneficiary"
        description="Capture the required details to register a new person."
      />

      <Form {...form}>
        <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Beneficiary Details</CardTitle>
                  <CardDescription>
                    Fill in the age and gender of the beneficiary.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                <CardFooter>
                    <Button type="button" onClick={handleGenerateDescription} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        Generate Description with AI
                    </Button>
                </CardFooter>
              </Card>

              {generatedDescription && (
                <Card className="bg-primary/10 border-primary/20 animate-in fade-in-0">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Wand2 className="text-accent" /> AI Generated Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-foreground/90 italic">"{generatedDescription}"</p>
                    </CardContent>
                </Card>
              )}

            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Capture Data</CardTitle>
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
                     <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Button variant="secondary">
                           <Camera className="mr-2 h-4 w-4" /> Capture Photo
                        </Button>
                     </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <MapPin className="mr-2 h-4 w-4" /> Get GPS Location
                  </Button>
                  <Button variant="outline" className="w-full">
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
            <Button type="submit" size="lg" disabled={!generatedDescription || form.formState.isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                Submit Registration
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
