
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Service, User } from '@/types';
import { BookOpen, Link as LinkIcon, Shuffle, FileText, Settings, Loader2, AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface UserServiceToggleListProps {
  user: User;
}

// Map of icon names (as stored in Firestore) to Lucide icon components
const iconComponents: Record<string, LucideIcon> = {
  "BookOpen": BookOpen,
  "Link": LinkIcon, // Assuming "Link" is the stored name for URL Shortener icon
  "Shuffle": Shuffle,
  "FileText": FileText,
  // Add other icons here as they are made available in ServiceFormDialog
  "Home": Settings, // Example, replace with actual icons
  "User": Settings,
  "Search": Settings,
  "Mail": Settings,
  "Bell": Settings,
  "Lock": Settings,
  "Briefcase": Settings,
  "Database": Settings,
  "Server": Settings,
  "Cloud": Settings,
  "Code": Settings,
  "Terminal": Settings,
  "PenTool": Settings,
  "Globe": Settings,
  "LayoutGrid": Settings,
  "List": Settings,
  "BarChart2": Settings,
  "PieChart": Settings,
  "Sliders": Settings,
  "Shield": Settings,
  "Gift": Settings,
  "ShoppingBag": Settings,
  "Settings": Settings, // Default/fallback
};


async function fetchServicesFromFirestore(): Promise<Service[]> {
  const servicesCol = collection(db, "services");
  const serviceSnapshot = await getDocs(servicesCol);
  const serviceList = serviceSnapshot.docs.map(docSnap => {
    // Firestore doc ID is the slug for services
    return { slug: docSnap.id, ...docSnap.data() } as Service;
  });
  return serviceList;
}

export function UserServiceToggleList({ user }: UserServiceToggleListProps) {
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [enabledServices, setEnabledServices] = useState<string[]>(user.enabledServices || []);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [isFetchingServices, setIsFetchingServices] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadServices = async () => {
      setIsFetchingServices(true);
      setFetchError(null);
      try {
        const fetchedServices = await fetchServicesFromFirestore();
        setAvailableServices(fetchedServices);
      } catch (error: any) {
        console.error("Error fetching services for toggle list:", error);
        setFetchError("Could not load available services. Please try again later.");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch service list."
        });
      } finally {
        setIsFetchingServices(false);
      }
    };
    loadServices();
  }, [toast]);

  useEffect(() => {
    setEnabledServices(user.enabledServices || []);
  }, [user.enabledServices]);

  const handleServiceToggle = async (serviceSlug: string, isEnabled: boolean) => {
    if (!user || !user.uid) {
        toast({ variant: "destructive", title: "Error", description: "User not authenticated." });
        return;
    }
    setLoadingStates(prev => ({ ...prev, [serviceSlug]: true }));
    
    try {
        const userDocRef = doc(db, "users", user.uid);
        if (isEnabled) {
            await updateDoc(userDocRef, {
                enabledServices: arrayUnion(serviceSlug)
            });
            setEnabledServices(prev => [...prev, serviceSlug]);
        } else {
            await updateDoc(userDocRef, {
                enabledServices: arrayRemove(serviceSlug)
            });
            setEnabledServices(prev => prev.filter(slug => slug !== serviceSlug));
        }

        toast({
        title: `Service ${isEnabled ? 'Enabled' : 'Disabled'}`,
        description: `${availableServices.find(s => s.slug === serviceSlug)?.name} has been ${isEnabled ? 'enabled' : 'disabled'}.`,
        });
    } catch (error) {
        console.error("Error updating services:", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update service status. Please try again."
        });
    } finally {
        setLoadingStates(prev => ({ ...prev, [serviceSlug]: false }));
    }
  };

  if (isFetchingServices) {
    return (
      <Card className="w-full shadow-lg rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-headline flex items-center">
            <Settings className="w-7 h-7 mr-3 text-primary" /> Manage Your Services
          </CardTitle>
          <CardDescription>Enable or disable access to connected services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex flex-col items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading available services...</p>
        </CardContent>
      </Card>
    );
  }

  if (fetchError) {
    return (
       <Card className="w-full shadow-lg rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-headline flex items-center">
             <Settings className="w-7 h-7 mr-3 text-primary" /> Manage Your Services
          </CardTitle>
          <CardDescription>Enable or disable access to connected services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex flex-col items-center justify-center h-40">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-destructive">{fetchError}</p>
        </CardContent>
      </Card>
    );
  }

  if (availableServices.length === 0) {
    return (
      <Card className="w-full shadow-lg rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-headline flex items-center">
            <Settings className="w-7 h-7 mr-3 text-primary" /> Manage Your Services
          </CardTitle>
          <CardDescription>Enable or disable access to connected services.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-10">
          <p className="text-muted-foreground">No services are currently configured by the administrator.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg rounded-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-headline flex items-center">
          <Settings className="w-7 h-7 mr-3 text-primary" /> Manage Your Services
        </CardTitle>
        <CardDescription>Enable or disable access to connected services. Toggle the switch to activate or deactivate a service.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {availableServices.map((service) => {
          const Icon = iconComponents[service.icon] || Settings; // Fallback to Settings icon
          const isServiceEnabled = enabledServices.includes(service.slug);
          const isLoading = loadingStates[service.slug];
          return (
            <div key={service.slug} className="flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 rounded-lg transition-colors duration-200">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-full">
                   <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <Label htmlFor={`service-${service.slug}`} className="text-lg font-medium cursor-pointer">
                    {service.name}
                  </Label>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                  <a href={service.url.startsWith('http') ? service.url : `https://${service.url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                    {service.url}
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                <Switch
                  id={`service-${service.slug}`}
                  checked={isServiceEnabled}
                  onCheckedChange={(checked) => handleServiceToggle(service.slug, checked)}
                  disabled={isLoading}
                  aria-label={`Toggle ${service.name}`}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
