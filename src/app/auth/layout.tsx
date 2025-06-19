import type { Metadata } from 'next';
import Link from 'next/link';
import { Rocket } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Authentication - Ozarnia Hub',
  description: 'Login or Register for Ozarnia Hub',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
