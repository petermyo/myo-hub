import type { Metadata } from 'next';
import { MainHeader } from '@/components/dashboard/main-header';
import { MainSidebar } from '@/components/dashboard/main-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export const metadata: Metadata = {
  title: 'Dashboard - Ozarnia Hub',
  description: 'Manage your Ozarnia Hub account and services.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen">
        <MainSidebar />
        <SidebarInset className="flex-1 flex flex-col bg-background">
          <MainHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
