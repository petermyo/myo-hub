import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-2">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground/90">Account Settings</h1>
          <p className="text-lg text-muted-foreground">Manage your account preferences and security settings.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Account settings options will be available here. This may include preferences for notifications, theme settings (light/dark mode), language, or security settings like password changes and two-factor authentication.
          </p>
          <div className="mt-6 p-8 border border-dashed rounded-lg text-center">
            <SettingsIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold">Settings Options Coming Soon</p>
            <p className="text-sm text-muted-foreground">Detailed account settings will be configurable here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
