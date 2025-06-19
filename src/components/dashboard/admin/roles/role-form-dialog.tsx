
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
import { Checkbox } from "@/components/ui/checkbox";
import type { Role, Permission } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";


export const availablePermissions: Permission[] = [
  // Global
  { id: 'global:full_access', name: 'Full System Access (Global Administrator)', description: 'Grants all permissions across the entire system. Typically only for the "Administrator" role.', category: 'Global' },
  
  // User Management
  { id: 'user:create', name: 'Create Users', description: 'Allows creating new user accounts.', category: 'User Management' },
  { id: 'user:read', name: 'Read Users', description: 'Allows viewing user lists and profiles.', category: 'User Management' },
  { id: 'user:update', name: 'Update Users', description: 'Allows editing user profiles, roles (excluding assigning Admin), and status.', category: 'User Management' },
  { id: 'user:delete', name: 'Delete Users', description: 'Allows deleting user accounts.', category: 'User Management' },
  
  // Role Management
  { id: 'role:create', name: 'Create Roles', description: 'Allows creating new roles and defining their permissions.', category: 'Role Management' },
  { id: 'role:read', name: 'Read Roles', description: 'Allows viewing existing roles and their permissions.', category: 'Role Management' },
  { id: 'role:update', name: 'Update Roles', description: 'Allows editing existing roles and their permissions.', category: 'Role Management' },
  { id: 'role:delete', name: 'Delete Roles', description: 'Allows deleting roles (except protected ones).', category: 'Role Management' },

  // Service Management (for configuring services themselves, not user access to them)
  { id: 'service:config:create', name: 'Create Service Configurations', description: 'Allows adding new services or service types to the platform.', category: 'Service Management' },
  { id: 'service:config:read', name: 'Read Service Configurations', description: 'Allows viewing global settings of available services.', category: 'Service Management' },
  { id: 'service:config:update', name: 'Update Service Configurations', description: 'Allows modifying global settings of available services.', category: 'Service Management' },
  { id: 'service:config:delete', name: 'Delete Service Configurations', description: 'Allows removing services or service types from the platform.', category: 'Service Management' },
  
  // Subscription Management
  { id: 'subscription:create', name: 'Create Subscription Plans', description: 'Allows creating new subscription plans.', category: 'Subscription Management' },
  { id: 'subscription:read', name: 'Read Subscription Plans', description: 'Allows viewing subscription plans.', category: 'Subscription Management' },
  { id: 'subscription:update', name: 'Update Subscription Plans', description: 'Allows editing existing subscription plans.', category: 'Subscription Management' },
  { id: 'subscription:delete', name: 'Delete Subscription Plans', description: 'Allows deleting subscription plans.', category: 'Subscription Management' },
  { id: 'subscription:assign', name: 'Assign Subscriptions to Users', description: 'Allows assigning subscription plans to users.', category: 'Subscription Management' },

  // Individual Service Access Permissions (examples, expand as needed)
  { id: 'service:content-service:access', name: 'Access Content Service', description: 'Allows user to access the Content Service.', category: 'Service Access' },
  { id: 'service:file-service:access', name: 'Access File Service', description: 'Allows user to access the File Service.', category: 'Service Access' },
  { id: 'service:url-shortener:access', name: 'Access URL Shortener', description: 'Allows user to access the URL Shortener.', category: 'Service Access' },
  { id: 'service:randomizer:access', name: 'Access Randomizer', description: 'Allows user to access the Randomizer tool.', category: 'Service Access' },
  // Add more specific service access permissions here, e.g., service:some-service:feature-x
];

const groupPermissionsByCategory = (permissions: Permission[]) => {
  return permissions.reduce((acc, permission) => {
    const category = permission.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
};


const roleFormSchema = z.object({
  name: z.string()
    .min(2, { message: "Role name must be at least 2 characters." })
    .max(50, { message: "Role name must not exceed 50 characters." }),
  description: z.string().min(5, { message: "Description must be at least 5 characters." }).max(200, { message: "Description must not exceed 200 characters." }),
  permissions: z.array(z.string()).min(0, { message: "Select at least one permission or none if applicable." }),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

interface RoleFormDialogProps {
  role?: Role | null;
  onFormSubmit: (values: Omit<Role, 'id'>, originalRoleId?: string) => Promise<void>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function RoleFormDialog({ role, onFormSubmit, isOpen, setIsOpen }: RoleFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!role;
  const protectedRoleNamesForEdit = ["administrator", "editor", "user"]; // Names that cannot be changed if editing these specific roles

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (role) {
        form.reset({
          name: role.name,
          description: role.description,
          permissions: role.permissions || [],
        });
      } else {
        form.reset({ name: "", description: "", permissions: [] });
      }
    }
  }, [role, form, isOpen]);

  const onSubmit = async (values: RoleFormValues) => {
    setIsLoading(true);

    const isNameProtectedForEdit = isEditing && role && protectedRoleNamesForEdit.includes(role.name.toLowerCase());

    if (isNameProtectedForEdit && role!.name.toLowerCase() !== values.name.toLowerCase()) {
      toast({
        variant: "destructive",
        title: "Action Not Allowed",
        description: `The name of the "${role!.name}" role cannot be changed as it is a protected role.`,
      });
      form.setValue("name", role!.name); // Reset name to original
      setIsLoading(false);
      return;
    }

    // Check for duplicate role name (case-insensitive)
    // Only check if adding a new role, OR if editing and the name has actually changed
    if (!isEditing || (isEditing && role && role.name.toLowerCase() !== values.name.toLowerCase())) {
        const rolesCol = collection(db, "roles");
        const q = query(rolesCol, where("name_lowercase", "==", values.name.toLowerCase())); // Query lowercase version
        const querySnapshot = await getDocs(q);
        
        let duplicateExists = false;
        if (!querySnapshot.empty) {
            // If editing, make sure the found duplicate isn't the role itself
            if (isEditing && role?.id) {
                const sameRole = querySnapshot.docs.some(docSnap => docSnap.id === role.id);
                if (!sameRole) { // A different role with the same name exists
                    duplicateExists = true;
                }
            } else { // If adding a new role, any match is a duplicate
                duplicateExists = true;
            }
        }

        if (duplicateExists) {
            toast({
                variant: "destructive",
                title: "Duplicate Role Name",
                description: `A role with the name "${values.name}" already exists. Please choose a different name.`,
            });
            setIsLoading(false);
            return;
        }
    }

    try {
      const dataToSubmit: Omit<Role, 'id'> & { name_lowercase?: string } = {
        ...values,
        name_lowercase: values.name.toLowerCase(), // Store lowercase name for case-insensitive checks
      };
      await onFormSubmit(dataToSubmit, role?.id);
      setIsOpen(false);
    } catch (error: any) {
      // Error toast is handled by parent, or specific ones here if needed
    } finally {
      setIsLoading(false);
    }
  };

  const nameIsReadOnly = isEditing && role && protectedRoleNamesForEdit.includes(role.name.toLowerCase());
  const groupedPermissions = groupPermissionsByCategory(availablePermissions);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Role" : "Add New Role"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modify the details of the existing role." : "Fill in the form to create a new role."}
            {nameIsReadOnly && <span className="block text-sm text-yellow-600 mt-1">The name of default roles (Administrator, Editor, User) cannot be changed.</span>}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Content Manager" 
                      {...field} 
                      readOnly={nameIsReadOnly}
                    />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Briefly describe what this role is for." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="permissions"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel className="text-base">Permissions</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Select the permissions this role will grant.
                    </p>
                  </div>
                  <ScrollArea className="h-72 rounded-md border p-4">
                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                      <div key={category} className="mb-4">
                        <h4 className="font-semibold text-md mb-2 pb-1 border-b">{category}</h4>
                        {perms.map((permission) => (
                          <FormField
                            key={permission.id}
                            control={form.control}
                            name="permissions"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={permission.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 mb-3"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(permission.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), permission.id])
                                          : field.onChange(
                                              (field.value || []).filter(
                                                (value) => value !== permission.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal text-sm">
                                    <span className="font-medium">{permission.name}</span>
                                    {permission.description && <p className="text-xs text-muted-foreground">{permission.description}</p>}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Role"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
