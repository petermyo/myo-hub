
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Rocket, LogIn, UserPlus, BookOpen, Link as LinkIcon, Shuffle, FileArchive, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ServiceFeature {
  icon: React.ElementType;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  aiHint: string;
  learnMoreLink?: string; // Optional: if services have dedicated pages later
}

const services: ServiceFeature[] = [
  {
    icon: BookOpen,
    title: "Content Platform",
    description: "Access exclusive articles, tutorials, and a wealth of curated content across various topics.",
    imageUrl: "https://placehold.co/600x400.png",
    imageAlt: "Content Platform illustration",
    aiHint: "library books",
    learnMoreLink: "/dashboard/my-services", // Example link
  },
  {
    icon: LinkIcon,
    title: "URL Shortener",
    description: "Create concise, shareable links. Track clicks and manage your shortened URLs with ease.",
    imageUrl: "https://placehold.co/600x400.png",
    imageAlt: "URL Shortener illustration",
    aiHint: "link chain",
    learnMoreLink: "/dashboard/my-services",
  },
  {
    icon: Shuffle,
    title: "Randomizer Tool",
    description: "Generate random numbers, lists, or make random selections for games, decisions, or data generation.",
    imageUrl: "https://placehold.co/600x400.png",
    imageAlt: "Randomizer Tool illustration",
    aiHint: "dice chance",
    learnMoreLink: "/dashboard/my-services",
  },
  {
    icon: FileArchive,
    title: "File Storage",
    description: "Securely store, organize, and share your files. Access your documents from anywhere.",
    imageUrl: "https://placehold.co/600x400.png",
    imageAlt: "File Storage illustration",
    aiHint: "cloud storage",
    learnMoreLink: "/dashboard/my-services",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/10">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <Rocket className="h-7 w-7" />
            <span className="text-2xl font-headline font-bold">Ozarnia Hub</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Link>
            </Button>
            <Button asChild>
              <Link href="/auth/register">
                <UserPlus className="mr-2 h-4 w-4" /> Register
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container text-center">
            <Rocket className="w-24 h-24 text-primary mx-auto mb-8 animate-pulse" />
            <h1 className="text-5xl md:text-7xl font-headline font-bold text-primary mb-6">
              Welcome to Ozarnia Hub
            </h1>
            <p className="text-xl md:text-2xl text-foreground/80 mb-10 max-w-3xl mx-auto">
              Your central panel for seamless access and management of Ozarnia's suite of powerful online services.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow transform hover:-translate-y-0.5">
                <Link href="/auth/register">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="shadow-lg hover:shadow-xl transition-shadow transform hover:-translate-y-0.5">
                <Link href="#services">
                  Explore Services
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-16 md:py-24 bg-background">
          <div className="container">
            <h2 className="text-4xl font-headline font-bold text-center mb-4 text-foreground/90">Our Services</h2>
            <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Discover the tools designed to enhance your productivity and digital experience.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {services.map((service) => (
                <Card key={service.title} className="overflow-hidden shadow-xl rounded-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col">
                  <div className="relative w-full h-56">
                    <Image
                      src={service.imageUrl}
                      alt={service.imageAlt}
                      layout="fill"
                      objectFit="cover"
                      data-ai-hint={service.aiHint}
                    />
                  </div>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <service.icon className="w-8 h-8 text-primary" />
                      <CardTitle className="text-2xl font-headline">{service.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <CardDescription className="text-base text-foreground/80">
                      {service.description}
                    </CardDescription>
                  </CardContent>
                  {service.learnMoreLink && (
                    <CardFooter>
                       <Button variant="outline" asChild className="w-full mt-4">
                          <Link href={service.learnMoreLink}>
                            Access Service <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 md:py-28 bg-muted/30">
          <div className="container text-center">
            <h2 className="text-4xl font-headline font-bold text-primary mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-foreground/80 mb-10 max-w-2xl mx-auto">
              Join Ozarnia Hub today to unlock all services and streamline your workflow.
            </p>
            <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow transform hover:-translate-y-0.5 px-10 py-6 text-lg">
              <Link href="/auth/register">
                <UserPlus className="mr-2 h-5 w-5" /> Sign Up Now
              </Link>
            </Button>
          </div>
        </section>
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
