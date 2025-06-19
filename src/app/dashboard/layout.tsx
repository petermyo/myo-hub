
"use client"; // Required for hooks like useEffect, useRouter

import type { Metadata } from 'next';
import { MainHeader } from '@/components/dashboard/main-header';
import { MainSidebar } from '@/components/dashboard/main-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// export const metadata: Metadata = { // Metadata can't be dynamic in client component easily
//   title: 'Dashboard - Ozarnia Hub',
//   description: 'Manage your Ozarnia Hub account and services.',
// };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') { // Ensure running on client
        document.title = 'Dashboard - Ozarnia Hub';
    }
    if (!loading && !currentUser) {
      router.push('/auth/login');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen">
        <MainSidebar />
        <SidebarInset className="flex-1 flex flex-col bg-background">
          <MainHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
