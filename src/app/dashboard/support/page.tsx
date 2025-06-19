import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Mail, MessageSquare, BookOpen } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
  return (
    <div className="container mx-auto py-2 space-y-8">
      <div className="flex items-center gap-3">
        <LifeBuoy className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground/90">Support Center</h1>
          <p className="text-lg text-muted-foreground">Find help and resources for Ozarnia Hub.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              FAQ & Documentation
            </CardTitle>
            <CardDescription>Browse our frequently asked questions and guides.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/docs">Visit Knowledge Base</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-6 h-6 text-primary" />
              Email Support
            </CardTitle>
            <CardDescription>Send us an email for direct assistance.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="mailto:support@myozarniaung.com">Contact Support</a>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              Community Forum
            </CardTitle>
            <CardDescription>Ask questions and share solutions with other users.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full" disabled>
              <Link href="/community">Go to Forum (Coming Soon)</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Troubleshooting Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
            <p><strong>Login Issues:</strong> Ensure your email and password are correct. Try resetting your password if needed.</p>
            <p><strong>Service Access:</strong> Check if the service is enabled in your "My Services" page. If issues persist, contact support.</p>
            <p><strong>Browser Compatibility:</strong> For the best experience, use a modern browser like Chrome, Firefox, or Edge.</p>
        </CardContent>
      </Card>

    </div>
  );
}
