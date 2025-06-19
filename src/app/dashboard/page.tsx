
"use client";
import { UserProfileCard } from "@/components/dashboard/profile/user-profile-card";
import { UserServiceToggleList } from "@/components/dashboard/services/user-service-toggle-list";
import type { User } from '@/types';
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
     return (
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-headline font-bold mb-2 text-foreground/90">Welcome to Ozarnia Hub</h1>
            <p className="text-lg text-muted-foreground">Please log in to see your dashboard.</p>
          </div>
        </div>
     );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-headline font-bold mb-2 text-foreground/90">Welcome to Ozarnia Hub, {currentUser.name}!</h1>
        <p className="text-lg text-muted-foreground">Here&apos;s an overview of your account and services.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <UserProfileCard />
        </div>
        <div className="lg:col-span-2">
          <UserServiceToggleList user={currentUser} />
        </div>
      </div>
    </div>
  );
}
