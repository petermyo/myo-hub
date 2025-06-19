
"use client"; // Required for hooks

import type { Metadata } from 'next';
import Link from 'next/link';
import { Rocket, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// export const metadata: Metadata = { // Metadata can't be dynamic in client component easily
//   title: 'Authentication - Ozarnia Hub',
//   description: 'Login or Register for Ozarnia Hub',
// };

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') { // Ensure running on client
        document.title = 'Authentication - Ozarnia Hub';
    }
    if (!loading && currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, loading, router]);

  if (loading || (!loading && currentUser)) { // Show loader if loading or if redirecting
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <Rocket className="h-8 w-8" />
          <span className="text-3xl font-headline font-bold">Ozarnia Hub</span>
        </Link>
      </div>
      {children}
    </div>
  );
}
