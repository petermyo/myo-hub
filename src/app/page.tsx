import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-background to-secondary/30">
      <Card className="w-full max-w-2xl shadow-2xl rounded-xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
        <CardHeader className="bg-primary/10 p-8 text-center">
          <div className="flex justify-center mb-6">
            <Rocket className="w-20 h-20 text-primary" />
          </div>
          <h1 className="text-5xl font-headline font-bold text-primary">Ozarnia Hub</h1>
          <CardDescription className="text-xl text-foreground/80 mt-3">
            Your central panel for managing access to Ozarnia services.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <p className="text-lg text-center text-foreground/90">
            Register an account or log in to enable and manage your services like
            Content, URL Shortener, Randomizer, and File Storage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="flex-1 shadow-lg hover:shadow-xl transition-shadow transform hover:-translate-y-0.5">
              <Link href="/auth/login">
                <LogIn className="mr-2 h-5 w-5" /> Login
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1 shadow-lg hover:shadow-xl transition-shadow transform hover:-translate-y-0.5">
              <Link href="/auth/register">
                <UserPlus className="mr-2 h-5 w-5" /> Register
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <footer className="mt-12 text-center text-foreground/70">
        <p>&copy; {new Date().getFullYear()} Ozarnia Hub by myozarniaung.com. All rights reserved.</p>
      </footer>
    </main>
  );
}
