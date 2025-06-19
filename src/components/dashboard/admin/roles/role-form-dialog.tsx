
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


const availablePermissions: Permission[] = [
  { id: 'service:content:read', name: 'Access Content Service', description: 'Allows viewing content from the content service.' },
  { id: 'service:content:write', name: 'Manage Content Service', description: 'Allows creating and editing content.' },
  { id: 'service:files:read', name: 'Access File Service (Read)', description: 'Allows reading/downloading files.' },
  { id: 'service:files:write', name: 'Access File Service (Write)', description: 'Allows uploading/modifying files.' },
  { id: 'service:shortener:manage', name: 'Manage URL Shortener', description: 'Allows creating and managing short links.' },
  { id: 'service:randomizer:use', name: 'Use Randomizer Tool', description: 'Allows using the randomizer tool.' },
  
  { id: 'admin:users:read', name: 'View Users', description: 'Allows viewing user list and profiles.' },
  { id: 'admin:users:create', name: 'Create Users', description: 'Allows creating new user accounts.' },
  { id: 'admin:users:update', name: 'Update User Profiles', description: 'Allows editing user profiles (name, email, basic info).' },
  { id: 'admin:users:assignroles', name: 'Assign User Roles', description: 'Allows changing a user\'s role.' },
  { id: 'admin:users:manage-status', name: 'Manage User Status', description: 'Allows activating or deactivating user accounts.' },
  { id: 'admin:users:delete', name: 'Delete Users', description: 'Allows deleting user accounts.' },
  
  { id: 'admin:roles:read', name: 'View Roles', description: 'Allows viewing roles and their permissions.' },
  { id: 'admin:roles:create', name: 'Create Roles', description: 'Allows creating new roles.' },
  { id: 'admin:roles:update', name: 'Update Roles', description: 'Allows editing existing roles and their permissions.' },
  { id: 'admin:roles:delete', name: 'Delete Roles', description: 'Allows deleting roles.' },
  
  { id: 'admin:services:manage', name: 'Manage Service Configurations', description: 'Allows managing global service settings.' },
  
  { id: 'admin:subscriptions:read', name: 'View Subscriptions', description: 'Allows viewing subscription plans.' },
  { id: 'admin:subscriptions:manage', name: 'Manage Subscriptions', description: 'Allows managing subscription plans and assigning them to users.' },
];


const roleFormSchema = z.object({
  name: z.string()
    .min(2, { message: "Role name must be at least 2 characters." })
    .max(50, { message: "Role name must not exceed 50 characters." })
    .refine(val => val.toLowerCase() !== "administrator" && val.toLowerCase() !== "editor" && val.toLowerCase() !== "user", {
      message: "Cannot use the names 'Administrator', 'Editor', or 'User' for new roles as they are protected.",
      // This part of refine is only for new roles. Editing these roles' names is blocked elsewhere.
    }),
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
  const protectedRoleNames = ["administrator", "editor", "user"];


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
    // Prevent editing the name of protected roles
    if (isEditing && role && protectedRoleNames.includes(role.name.toLowerCase()) && role.name !== values.name) {
      toast({
        variant: "destructive",
        title: "Action Not Allowed",
        description: `The name of the "${role.name}" role cannot be changed.`,
      });
      form.setValue("name", role.name); // Reset name to original
      setIsLoading(false);
      return;
    }

    // Check for duplicate role name if adding a new role or if name changed during edit
    if (!isEditing || (isEditing && role && role.name.toLowerCase() !== values.name.toLowerCase())) {
        const rolesCol = collection(db, "roles");
        const q = query(rolesCol, where("name", "==", values.name));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            // Check if the duplicate found is the same role being edited (if its ID matches)
            let isSameRoleBeingEdited = false;
            if (isEditing && role?.id) {
                querySnapshot.forEach(docSnap => {
                    if (docSnap.id === role.id) {
                        isSameRoleBeingEdited = true;
                    }
                });
            }
            if (!isSameRoleBeingEdited) {
                toast({
                    variant: "destructive",
                    title: "Duplicate Role",
                    description: `A role with the name "${values.name}" already exists.`,
                });
                setIsLoading(false);
                return;
            }
        }
    }


    try {
      await onFormSubmit(values, role?.id);
      setIsOpen(false);
    } catch (error: any) {
      // Error toast is handled by parent, or specific ones here if needed
    } finally {
      setIsLoading(false);
    }
  };

  const nameIsReadOnly = isEditing && role && protectedRoleNames.includes(role.name.toLowerCase());

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Role" : "Add New Role"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modify the details of the existing role." : "Fill in the form to create a new role."}
            {nameIsReadOnly && <span className="block text-sm text-yellow-600 mt-1">The name of default roles cannot be changed.</span>}
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
                  <ScrollArea className="h-60 rounded-md border p-4">
                    {availablePermissions.map((permission) => (
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
