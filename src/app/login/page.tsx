'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLogo from '@/components/app-logo';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]\d{3}[)])?[\s-]?\d{3}[\s-]?\d{4}$/
);

const formSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Invalid phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'ngo-worker';
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: '',
      otp: '',
    },
  });

  const handleSendOtp = () => {
    setIsOtpSent(true);
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoggingIn(true);
    // Simulate API call
    setTimeout(() => {
      switch (role) {
        case 'supervisor':
          router.push('/supervisor/dashboard');
          break;
        case 'vendor':
          router.push('/vendor/scan');
          break;
        case 'ngo-worker':
        default:
          router.push('/ngo/dashboard');
          break;
      }
    }, 1000);
  }

  const roleName = (role: string) => {
    return role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/30">
      <Link href="/" className="absolute top-4 left-4">
        <Button variant="outline">&larr; Back to Role Selection</Button>
      </Link>
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in-50 zoom-in-95 duration-500">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AppLogo className="text-4xl" />
          </div>
          <CardTitle className="font-headline text-2xl">
            {roleName(role)} Login
          </CardTitle>
          <CardDescription>
            {isOtpSent ? 'Enter the OTP sent to your phone.' : 'Enter your phone number to continue.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className={`space-y-4 ${isOtpSent ? 'opacity-50' : ''}`}>
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 98765 43210" {...field} disabled={isOtpSent} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {isOtpSent ? (
                 <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-5 duration-500">
                    <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>One-Time Password (OTP)</FormLabel>
                        <FormControl>
                            <Input placeholder="123456" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoggingIn}>
                        {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Login
                    </Button>
                </div>
              ) : (
                <Button type="button" onClick={handleSendOtp} className="w-full">
                  Send OTP
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginPageContent />
        </Suspense>
    )
}
