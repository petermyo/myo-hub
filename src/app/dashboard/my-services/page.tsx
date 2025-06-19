import { UserServiceToggleList } from "@/components/dashboard/services/user-service-toggle-list";
import type { User } from '@/types';
import { Layers } from "lucide-react";

// This would typically come from an auth context or API call
const dummyUser: User = {
  id: "user123",
  name: "Demo User",
  email: "demo@example.com",
  role: "User",
  status: "active",
  createdAt: new Date().toISOString(),
  avatarUrl: "https://placehold.co/150x150.png",
  enabledServices: ["content-service", "shortener-service"],
};

export default function MyServicesPage() {
  return (
    <div className="space-y-8">
       <div className="flex items-center gap-3">
        <Layers className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground/90">My Services</h1>
          <p className="text-lg text-muted-foreground">Manage your access to Ozarnia Hub services.</p>
        </div>
      </div>
      <UserServiceToggleList user={dummyUser} />
    </div>
  );
}
