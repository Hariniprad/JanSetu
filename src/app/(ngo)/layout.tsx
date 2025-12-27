import AppLogo from '@/components/app-logo';
import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  UserPlus,
  List,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';

const navItems = [
  { href: '/ngo/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
  { href: '/ngo/register', icon: <UserPlus />, label: 'Register Beneficiary' },
  { href: '/ngo/my-registrations', icon: <List />, label: 'My Registrations' },
];

export default function NgoLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <AppLogo className="text-2xl" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild>
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start text-left px-2">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src="https://picsum.photos/seed/ngo/100/100" />
                  <AvatarFallback>RK</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="font-medium text-sm">Ravi Kumar</span>
                  <span className="text-xs text-muted-foreground">NGO Worker</span>
                </div>
                <ChevronDown className="ml-auto h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Ravi Kumar</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    ravi.k@example.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">NGO Worker Portal</span>
            </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
