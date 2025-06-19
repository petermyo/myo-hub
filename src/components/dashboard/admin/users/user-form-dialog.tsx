
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface RoleOption {
  id: string;
  name: string;
}

const userFormSchemaBase = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  role: z.string().min(1, { message: "Please select a role." }),
  status: z.enum(['active', 'inactive', 'pending'], { required_error: "Please select a status."}),
});

const newUserFormSchema = userFormSchemaBase.extend({
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const editUserFormSchema = userFormSchemaBase;


interface UserFormDialogProps {
  user?: User | null;
  triggerButton?: ReactNode;
  onFormSubmit: (values: Partial<User> & { password?: string }, originalUserUid?: string) => Promise<void>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  availableRoles: RoleOption[];
  currentUserRole?: string; // Role of the user performing the action
}

export function UserFormDialog({ user, triggerButton, onFormSubmit, isOpen, setIsOpen, availableRoles, currentUserRole }: UserFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!user;

  const form = useForm<z.infer<typeof userFormSchemaBase & { password?: string; confirmPassword?: string }>>({
    resolver: zodResolver(isEditing ? editUserFormSchema : newUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      status: "active",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (isOpen) { 
        if (user) {
        form.reset({
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status || "active",
            password: "", 
            confirmPassword: "",
        });
        } else {
        form.reset({ name: "", email: "", role: "", status: "active", password: "", confirmPassword: ""});
        }
    }
  }, [user, form, isOpen]);


  async function onSubmit(values: z.infer<typeof userFormSchemaBase & { password?: string; confirmPassword?: string }>) {
    setIsLoading(true);
    try {
      // If editing, and the current user is an "Editor", they cannot change a user's role to "Administrator"
      // or change an "Administrator"'s role to something else.
      if (isEditing && currentUserRole === "Editor") {
        if (values.role === "Administrator" && user?.role !== "Administrator") {
          throw new Error("Editors cannot assign the Administrator role.");
        }
        if (user?.role === "Administrator" && values.role !== "Administrator") {
          throw new Error("Editors cannot change the role of an Administrator.");
        }
      }

      const submittedUser: Partial<User> & { password?: string } = {
        uid: user?.uid || "", 
        name: values.name,
        email: values.email, // Email is read-only in form for edits, but submitted
        role: values.role,
        status: values.status,
        // Only include password if it's a new user form
        ...( !isEditing && values.password && { password: values.password }),
      };
      await onFormSubmit(submittedUser, user?.uid);
      // Success toast is handled by parent page
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

  const isRoleFieldDisabled = isEditing && currentUserRole === "Editor" && (user?.role === "Administrator" || user?.role === "Editor");
  const filteredRolesForEditor = availableRoles.filter(
    (roleOpt) => !(currentUserRole === "Editor" && roleOpt.id === "Administrator")
  );


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
                  {isEditing && <p className="text-xs text-muted-foreground">Email cannot be changed after creation through this form. Firebase Auth user email needs separate handling for changes.</p>}
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
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isRoleFieldDisabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(currentUserRole === "Editor" ? filteredRolesForEditor : availableRoles).map((roleOpt) => (
                        <SelectItem key={roleOpt.id} value={roleOpt.id} disabled={isEditing && currentUserRole === "Editor" && user?.role === "Administrator" && roleOpt.id !== "Administrator"}>
                          {roleOpt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isRoleFieldDisabled && <p className="text-xs text-muted-foreground">Editors cannot change the role of Administrators or other Editors.</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
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
