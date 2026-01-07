import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PublicDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
            <AppLogo className="text-3xl" />
        </Link>
        <div className="ml-auto">
            <Link href="/login?role=ngo">
                <Button>Portal Login</Button>
            </Link>
        </div>
      </header>
      <main className="p-4 sm:px-6 sm:py-0">{children}</main>
       <footer className="text-center p-6 text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} JanSetu. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
