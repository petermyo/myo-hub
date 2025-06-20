
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileCode, LifeBuoy, Users, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <BookOpen className="h-7 w-7" />
            <span className="text-2xl font-headline font-bold">Ozarnia Hub Docs</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 md:py-16">
        <div className="container space-y-12">
          <section className="text-center">
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4">
              Ozarnia Hub Documentation
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Welcome to the official documentation for Ozarnia Hub. Find guides, API references, and support information here.
            </p>
          </section>

          <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" />
                  Getting Started
                </CardTitle>
                <CardDescription>Learn how to sign up, log in, and navigate your dashboard.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full" disabled>
                  <Link href="/docs/getting-started">Read Guide (Coming Soon)</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="w-6 h-6 text-primary" />
                  API Reference
                </CardTitle>
                <CardDescription>Integrate your services with Ozarnia Hub using our API.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/docs/api">Explore API Docs</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LifeBuoy className="w-6 h-6 text-primary" />
                  Support & FAQ
                </CardTitle>
                <CardDescription>Find answers to common questions and troubleshooting tips.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/support">Visit Support Center</Link>
                </Button>
              </CardContent>
            </Card>
          </section>

          <section>
            <Card>
                <CardHeader>
                    <CardTitle>About Ozarnia Hub</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-muted-foreground">
                    <p>Ozarnia Hub is your central platform for accessing and managing a variety of online services. Our goal is to provide a seamless and integrated experience for all users.</p>
                    <p>This documentation portal will grow as we add more features and services. If you have any questions or need assistance, please don't hesitate to reach out via our Support Center.</p>
                </CardContent>
            </Card>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t bg-background">
        <div className="container text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Ozarnia Hub by myozarniaung.com. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
