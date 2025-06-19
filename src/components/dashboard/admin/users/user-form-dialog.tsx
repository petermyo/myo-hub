
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
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User } from "@/types"; // Role type might be needed if complex
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, ReactNode } from "react";
import { Loader2 } from "lucide-react";

// Dummy roles data - in a real app, this might come from Firestore or config
const availableRoles = [
  { id: "Administrator", name: "Administrator" },
  { id: "Editor", name: "Editor" },
  { id: "User", name: "User" },
];

const userFormSchemaBase = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  role: z.string().min(1, { message: "Please select a role." }),
});

// Schema for adding a new user (password is required)
const newUserFormSchema = userFormSchemaBase.extend({
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Schema for editing an existing user (password is optional or not present)
const editUserFormSchema = userFormSchemaBase;


interface UserFormDialogProps {
  user?: User | null; // User object for editing, null/undefined for adding
  triggerButton?: ReactNode;
  onFormSubmit: (values: User, originalUserUid?: string) => Promise<void>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function UserFormDialog({ user, triggerButton, onFormSubmit, isOpen, setIsOpen }: UserFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!user;

  const form = useForm<z.infer<typeof userFormSchemaBase & { password?: string; confirmPassword?: string }>>({
    resolver: zodResolver(isEditing ? editUserFormSchema : newUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (isOpen) { // Reset form when dialog opens
        if (user) {
        form.reset({
            name: user.name,
            email: user.email,
            role: user.role,
            password: "", // Don't prefill password for editing
            confirmPassword: "",
        });
        } else {
        form.reset({ name: "", email: "", role: "", password: "", confirmPassword: ""});
        }
    }
  }, [user, form, isOpen]);


  async function onSubmit(values: z.infer<typeof userFormSchemaBase & { password?: string; confirmPassword?: string }>) {
    setIsLoading(true);
    try {
      const submittedUser: User = {
        uid: user?.uid || "", // Will be set by Firebase Auth on creation if new
        name: values.name,
        email: values.email,
        role: values.role,
        status: user?.status || 'active', // Default for new, preserve for existing
        createdAt: user?.createdAt || new Date().toISOString(),
        // Only include password if it's a new user form
        ...( !isEditing && values.password && { password: values.password }),
      };
      await onFormSubmit(submittedUser, user?.uid); // Pass original UID for edits
      toast({
        title: user ? "User Updated" : "User Created",
        description: `${values.name} has been successfully ${user ? 'updated' : 'added'}.`,
      });
      setIsOpen(false);
    } catch (error: any) {
      console.error("User form submission error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || `Failed to ${user ? 'update' : 'create'} user. Please try again.`,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerButton && <DialogTrigger asChild onClick={() => setIsOpen(true)}>{triggerButton}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Add New User"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modify the details of the existing user." : "Fill in the form to create a new user account."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="user@example.com" {...field} type="email" readOnly={isEditing} />
                  </FormControl>
                  {isEditing && <p className="text-xs text-muted-foreground">Email cannot be changed after creation through this form.</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRoles.map((roleOpt) => (
                        <SelectItem key={roleOpt.id} value={roleOpt.id}>
                          {roleOpt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEditing && (
              <>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input placeholder="••••••••" {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input placeholder="••••••••" {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
