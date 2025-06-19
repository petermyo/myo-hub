
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription as FormDesc, // Renamed to avoid conflict
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch"; // Added Switch
import type { Service, SubscriptionPlan } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Settings } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as LucideIcons from "lucide-react";

const availableLucideIcons: (keyof typeof LucideIcons)[] = [
  "Home", "User", "Settings", "Search", "Mail", "Bell", "Lock", "Link", "Briefcase", "BookOpen", "FileText", "Shuffle", "Database", "Server", "Cloud", "Code", "Terminal", "PenTool", "Globe", "LayoutGrid", "List", "BarChart2", "PieChart", "Sliders", "Shield", "Gift", "ShoppingBag"
];

const serviceFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  newSlug: z.string().min(2, "Slug must be at least 2 characters.").max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
  description: z.string().optional(),
  icon: z.string().min(1, "Please select an icon."),
  url: z.string().min(3, "URL must be at least 3 characters.").max(100)
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please enter a valid domain (e.g., example.com)."),
  isActive: z.boolean().default(true),
  linkedSubscriptionIds: z.array(z.string()).optional(),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface ServiceFormDialogProps {
  service?: Service | null;
  onFormSubmit: (values: Omit<Service, 'slug'> & { newSlug: string }, originalSlug?: string) => Promise<void>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  availableSubscriptionPlans: SubscriptionPlan[];
}

export function ServiceFormDialog({ service, onFormSubmit, isOpen, setIsOpen, availableSubscriptionPlans }: ServiceFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!service;

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      newSlug: "",
      description: "",
      icon: "",
      url: "",
      isActive: true,
      linkedSubscriptionIds: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (service) {
        form.reset({
          name: service.name,
          newSlug: service.slug,
          description: service.description || "",
          icon: service.icon,
          url: service.url,
          isActive: service.isActive === undefined ? true : service.isActive, // Default to true if undefined
          linkedSubscriptionIds: service.linkedSubscriptionIds || [],
        });
      } else {
        form.reset({
          name: "",
          newSlug: "",
          description: "",
          icon: "",
          url: "",
          isActive: true, // Default new services to active
          linkedSubscriptionIds: [],
        });
      }
    }
  }, [service, form, isOpen]);

  const onSubmit = async (values: ServiceFormValues) => {
    setIsLoading(true);
    try {
      const dataToSubmit: Omit<Service, 'slug'> & { newSlug: string } = {
        name: values.name,
        newSlug: values.newSlug,
        description: values.description || "",
        icon: values.icon,
        url: values.url,
        isActive: values.isActive,
        linkedSubscriptionIds: values.linkedSubscriptionIds || [],
      };
      await onFormSubmit(dataToSubmit, service?.slug);
      setIsOpen(false);
    } catch (error: any) {
      // Error toast is handled by parent
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderLucideIconPreview = (iconName: string) => {
    const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as LucideIcons.LucideIcon | undefined;
    if (!IconComponent) {
      return <Settings className="w-5 h-5 text-muted-foreground" />;
    }
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Service" : "Add New Service"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modify the details of the existing service." : "Fill in the form to create a new service."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 py-1">
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Awesome File Storage" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newSlug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (Unique Identifier)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., awesome-file-storage" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Briefly describe this service." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service URL (Domain)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., files.example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <div className="flex items-center gap-2">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableLucideIcons.map(iconName => (
                              <SelectItem key={iconName} value={iconName}>
                                <div className="flex items-center gap-2">
                                  {renderLucideIconPreview(iconName)}
                                  {iconName}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {field.value && <div className="p-2 border rounded-md bg-muted">{renderLucideIconPreview(field.value)}</div>}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Service Status</FormLabel>
                        <FormDesc>
                          Inactive services will not be visible to users.
                        </FormDesc>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="linkedSubscriptionIds"
                  render={() => (
                    <FormItem>
                      <div className="mb-2">
                        <FormLabel className="text-base">Link Subscription Plans</FormLabel>
                         <FormDesc>
                            Select which subscription plans can grant access to this service.
                        </FormDesc>
                      </div>
                      <ScrollArea className="h-40 rounded-md border p-4">
                        {availableSubscriptionPlans.length > 0 ? availableSubscriptionPlans.map((plan) => (
                          <FormField
                            key={plan.id}
                            control={form.control}
                            name="linkedSubscriptionIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={plan.id}
                                  className="flex flex-row items-center space-x-3 space-y-0 mb-2"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(plan.id!)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), plan.id!])
                                          : field.onChange(
                                              (field.value || []).filter(
                                                (value) => value !== plan.id!
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal text-sm">
                                    {plan.name} <span className="text-xs text-muted-foreground">({plan.price})</span>
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        )) : <p className="text-sm text-muted-foreground">No subscription plans available to link. Please create subscription plans first.</p>}
                      </ScrollArea>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Service"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
