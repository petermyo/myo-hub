
"use client";
import { UserServiceToggleList } from "@/components/dashboard/services/user-service-toggle-list";
import type { User } from '@/types';
import { Layers, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function MyServicesPage() {
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
            <div className="flex items-center gap-3">
                <Layers className="w-10 h-10 text-primary" />
                <div>
                <h1 className="text-3xl font-headline font-bold text-foreground/90">My Services</h1>
                <p className="text-lg text-muted-foreground">Please log in to manage your services.</p>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8">
       <div className="flex items-center gap-3">
        <Layers className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground/90">My Services</h1>
          <p className="text-lg text-muted-foreground">Manage your access to Ozarnia Hub services.</p>
        </div>
      </div>
      <UserServiceToggleList user={currentUser} />
    </div>
  );
}
