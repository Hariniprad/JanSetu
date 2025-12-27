import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockBeneficiaries } from '@/lib/mock-data';
import { ArrowRight, UserPlus, List } from 'lucide-react';
import Link from 'next/link';

const stats = [
    {
        name: 'My Registrations',
        value: mockBeneficiaries.filter(b => b.registeredBy === 'Ravi Kumar').length,
        change: '+3 this week',
    },
    {
        name: 'Pending Approval',
        value: mockBeneficiaries.filter(b => b.registeredBy === 'Ravi Kumar' && b.status === 'Pending').length,
        change: '2 new',
    },
    {
        name: 'Total Approved',
        value: mockBeneficiaries.filter(b => b.registeredBy === 'Ravi Kumar' && b.status === 'Approved').length,
        change: '+1 this week',
    },
];

const quickLinks = [
    {
        title: 'Register New Beneficiary',
        description: 'Start a new registration form.',
        href: '/ngo/register',
        icon: <UserPlus className="h-6 w-6 text-primary" />,
    },
    {
        title: 'View My Registrations',
        description: 'See the status of all your registrations.',
        href: '/ngo/my-registrations',
        icon: <List className="h-6 w-6 text-primary" />,
    },
]

export default function NgoDashboard() {
  return (
    <div className="space-y-8">
      <PageHeader title="Welcome, Ravi!" description="Here's a summary of your activities." />

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(stat => (
            <Card key={stat.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
            </Card>
        ))}
      </div>
      
      <div>
        <h2 className="text-xl font-headline font-bold mb-4">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-2">
            {quickLinks.map(link => (
                <Link href={link.href} key={link.title}>
                    <Card className="hover:bg-card/90 hover:shadow-md transition-all">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">{link.icon}</div>
                            <div className="flex-1">
                                <CardTitle className="text-lg font-semibold">{link.title}</CardTitle>
                                <CardDescription>{link.description}</CardDescription>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                    </Card>
                </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
