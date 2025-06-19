
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import type { SubscriptionPlan } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const subscriptionFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  slug: z.string().min(2, "Slug must be at least 2 characters.").max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
  description: z.string().optional(),
  duration: z.enum(["Monthly", "Unlimited"]),
  points: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)), // Convert empty string to 0, otherwise to number
    z.number().int().min(0, "Points must be a non-negative integer.")
  ),
  storageLimitMB: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().int().min(0, "Storage limit must be a non-negative integer.")
  ),
  price: z.string().min(1, "Price is required (e.g., Free, $10/month).").max(50),
});

type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

interface SubscriptionFormDialogProps {
  plan?: SubscriptionPlan | null;
  onFormSubmit: (values: Omit<SubscriptionPlan, 'id'>, originalPlanId?: string) => Promise<void>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function SubscriptionFormDialog({ plan, onFormSubmit, isOpen, setIsOpen }: SubscriptionFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!plan;

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      duration: "Monthly",
      points: 0,
      storageLimitMB: 0,
      price: "Free",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (plan) {
        form.reset({
          name: plan.name,
          slug: plan.slug,
          description: plan.description || "",
          duration: plan.duration,
          points: plan.points,
          storageLimitMB: plan.storageLimitMB,
          price: plan.price,
        });
      } else {
        form.reset({
          name: "",
          slug: "",
          description: "",
          duration: "Monthly",
          points: 0,
          storageLimitMB: 0,
          price: "Free",
        });
      }
    }
  }, [plan, form, isOpen]);

  const onSubmit = async (values: SubscriptionFormValues) => {
    setIsLoading(true);
    try {
      const dataToSubmit: Omit<SubscriptionPlan, 'id'> = {
        ...values,
        description: values.description || undefined, // Ensure undefined if empty
      };
      await onFormSubmit(dataToSubmit, plan?.id);
      setIsOpen(false);
    } catch (error: any) {
      // Error toast is handled by parent, or specific ones here if needed
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Subscription" : "Add New Subscription"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modify the details of the existing subscription." : "Fill in the form to create a new subscription."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subscription Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Basic Subscription" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., basic-subscription" {...field} />
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
                        <Textarea placeholder="Briefly describe this subscription." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Free, $9.99/month" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Unlimited">Unlimited</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points (0 for unlimited)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="storageLimitMB"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Limit (MB, 0 for unlimited)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
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
                {isEditing ? "Save Changes" : "Create Subscription"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
