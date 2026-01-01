import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export default function AppLogo({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1 className={cn('font-headline font-bold text-primary tracking-tight', className)} {...props}>
      Jan<span className="text-accent">Setu</span>
    </h1>
  );
}
