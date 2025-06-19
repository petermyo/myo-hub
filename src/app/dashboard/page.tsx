import { UserProfileCard } from "@/components/dashboard/profile/user-profile-card";
import { UserServiceToggleList } from "@/components/dashboard/services/user-service-toggle-list";
import type { User } from '@/types'; // Assuming User type is defined

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

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-headline font-bold mb-2 text-foreground/90">Welcome to Ozarnia Hub</h1>
        <p className="text-lg text-muted-foreground">Here&apos;s an overview of your account and services.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <UserProfileCard />
        </div>
        <div className="lg:col-span-2">
          <UserServiceToggleList user={dummyUser} />
        </div>
      </div>
    </div>
  );
}
