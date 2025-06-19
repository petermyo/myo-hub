import { UserProfileCard } from "@/components/dashboard/profile/user-profile-card";
import { UserCircle } from "lucide-react";

export default function UserProfilePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <UserCircle className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground/90">My Profile</h1>
          <p className="text-lg text-muted-foreground">View and update your personal information.</p>
        </div>
      </div>
      <div className="flex justify-center">
        <UserProfileCard />
      </div>
    </div>
  );
}
