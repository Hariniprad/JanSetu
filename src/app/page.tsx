import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, UserCheck, Store } from 'lucide-react';
import AppLogo from '@/components/app-logo';

const roles = [
  {
    name: 'NGO Worker',
    description: 'Register and manage beneficiaries on the ground.',
    icon: <Users className="h-8 w-8 text-primary" />,
    href: '/login?role=ngo-worker',
  },
  {
    name: 'Supervisor',
    description: 'Approve new beneficiary registrations.',
    icon: <UserCheck className="h-8 w-8 text-primary" />,
    href: '/login?role=supervisor',
  },
  {
    name: 'Vendor',
    description: 'Verify beneficiaries and distribute benefits.',
    icon: <Store className="h-8 w-8 text-primary" />,
    href: '/login?role=vendor',
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-background to-secondary/30">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <AppLogo className="mb-4 text-5xl sm:text-6xl" />
          <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto">
            Connecting communities, one registration at a time.
          </p>
        </header>

        <Card className="shadow-2xl bg-card/80 backdrop-blur-sm animate-in fade-in-50 zoom-in-95 duration-500">
          <CardHeader>
            <CardTitle className="text-center text-2xl sm:text-3xl font-headline">Choose Your Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {roles.map((role, index) => (
                <div key={role.name} className="animate-in fade-in-0 slide-in-from-bottom-5 delay-300 duration-500" style={{ animationDelay: `${index * 150}ms` }}>
                  <Link href={role.href} className="h-full block">
                    <Card className="group h-full text-center hover:shadow-lg hover:-translate-y-1 transition-transform duration-300 ease-in-out">
                      <CardHeader className="items-center">
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                          {role.icon}
                        </div>
                        <CardTitle className="font-headline text-xl">{role.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-6">{role.description}</p>
                        <Button variant="outline" className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                          Proceed
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <footer className="text-center mt-12 text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} JanSetu. All Rights Reserved.</p>
      </footer>
    </main>
  );
}
