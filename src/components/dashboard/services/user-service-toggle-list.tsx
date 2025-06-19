"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Service, User } from '@/types';
import { BookOpen, LinkIcon as ShortenerIcon, Shuffle, FileText, Settings, Loader2 } from 'lucide-react';
import Image from 'next/image';

// Dummy services data - replace with actual data fetching
const allServices: Service[] = [
  { id: "content-service", name: "Content Platform", description: "Access exclusive articles and content.", url: "content.myozarniaung.com", icon: BookOpen, category: 'Content' },
  { id: "shortener-service", name: "URL Shortener", description: "Create and manage short links.", url: "shortner.myozarniaung.com", icon: ShortenerIcon, category: 'Utility' },
  { id: "randomizer-service", name: "Randomizer Tool", description: "Generate random data and selections.", url: "randomizer.myozarniaung.com", icon: Shuffle, category: 'Utility' },
  { id: "file-service", name: "File Storage", description: "Securely store and share your files.", url: "file.myozarniaung.com", icon: FileText, category: 'Storage' },
];

interface UserServiceToggleListProps {
  user: User; // Assuming user object contains enabledServices
}

export function UserServiceToggleList({ user: initialUser }: UserServiceToggleListProps) {
  const [enabledServices, setEnabledServices] = useState<string[]>(initialUser.enabledServices || []);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handleServiceToggle = async (serviceId: string, isEnabled: boolean) => {
    setLoadingStates(prev => ({ ...prev, [serviceId]: true }));
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 750));

    setEnabledServices(prev =>
      isEnabled ? [...prev, serviceId] : prev.filter(id => id !== serviceId)
    );

    toast({
      title: `Service ${isEnabled ? 'Enabled' : 'Disabled'}`,
      description: `${allServices.find(s => s.id === serviceId)?.name} has been ${isEnabled ? 'enabled' : 'disabled'}.`,
    });
    setLoadingStates(prev => ({ ...prev, [serviceId]: false }));
  };

  return (
    <Card className="w-full shadow-lg rounded-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-headline flex items-center">
          <Settings className="w-7 h-7 mr-3 text-primary" /> Manage Your Services
        </CardTitle>
        <CardDescription>Enable or disable access to connected services.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {allServices.map((service) => {
          const Icon = service.icon || Settings;
          const isEnabled = enabledServices.includes(service.id);
          const isLoading = loadingStates[service.id];
          return (
            <div key={service.id} className="flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 rounded-lg transition-colors duration-200">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-full">
                   <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <Label htmlFor={`service-${service.id}`} className="text-lg font-medium cursor-pointer">
                    {service.name}
                  </Label>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                  <a href={`https://${service.url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                    {service.url}
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                <Switch
                  id={`service-${service.id}`}
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleServiceToggle(service.id, checked)}
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
