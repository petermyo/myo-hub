
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
      
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Preferences</CardTitle>
          <CardDescription>
            Account settings options will be available here. This may include preferences for notifications, theme settings (light/dark mode), language, or security settings like password changes and two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-4 p-8 border border-dashed rounded-lg text-center bg-muted/20">
            <SettingsIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold text-foreground/80">Settings Options Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-1">Detailed account settings will be configurable here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
