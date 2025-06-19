
"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusCircle, ShieldCheck, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Role } from "@/types";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, where, writeBatch } from "firebase/firestore";
import { RolesDataTable } from "@/components/dashboard/admin/roles/roles-data-table";
import { columns as defineRoleColumns } from "@/components/dashboard/admin/roles/roles-table-columns";
import { RoleFormDialog, availablePermissions } from "@/components/dashboard/admin/roles/role-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


async function fetchRolesFromFirestore(): Promise<Role[]> {
  const rolesCol = collection(db, "roles");
  const roleSnapshot = await getDocs(rolesCol);
  const roleList = roleSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Role));
  return roleList;
}

async function isRoleInUse(roleName: string): Promise<boolean> {
  const usersCol = collection(db, "users");
  // Ensure we compare with the actual 'role' field in user documents
  const q = query(usersCol, where("role", "==", roleName));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

const PROTECTED_ROLES = ["Administrator", "Editor", "User"]; // Case-sensitive
const PROTECTED_ROLES_LOWERCASE = PROTECTED_ROLES.map(r => r.toLowerCase());


const getDefaultRolePermissions = (roleName: string): string[] => {
    const basePermissions = availablePermissions.map(p => p.id);
    switch (roleName.toLowerCase()) {
        case "administrator":
            return basePermissions; // All permissions
        case "editor":
            return basePermissions.filter(p =>
                p.startsWith("user:read") || p.startsWith("user:update") || // User Read, Update
                p.startsWith("service:config:") || // Service Config CRUD
                p.startsWith("service:") && p.endsWith(":access") // Individual service access (R only)
            );
        case "user":
            return basePermissions.filter(p => p.startsWith("service:") && p.endsWith(":access")); // Only individual service access R
        default:
            return [];
    }
};


export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeedingRoles, setIsSeedingRoles] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const { toast } = useToast();

  const loadRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedRoles = await fetchRolesFromFirestore();
      setRoles(fetchedRoles);
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      let description = "Could not fetch roles.";
      if (error.message) {
        description += ` Message: ${error.message}`;
      }
      if (error.code) {
        description += ` Code: ${error.code}`;
      }
      toast({ variant: "destructive", title: "Error Loading Roles", description });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleSeedDefaultRoles = async () => {
    setIsSeedingRoles(true);
    try {
        const existingRoleNamesLowercase = roles.map(r => r.name.toLowerCase());
        const rolesToCreate = PROTECTED_ROLES.filter(pr => !existingRoleNamesLowercase.includes(pr.toLowerCase()));

        if (rolesToCreate.length === 0) {
            toast({ title: "Default Roles Exist", description: "All default roles (Administrator, Editor, User) already exist." });
            setIsSeedingRoles(false);
            return;
        }

        const batch = writeBatch(db);
        rolesToCreate.forEach(roleName => {
            const roleDocRef = doc(collection(db, "roles"));
            const newRole: Omit<Role, 'id'> & { name_lowercase: string } = {
                name: roleName,
                description: `Default ${roleName} role with standard permissions.`,
                permissions: getDefaultRolePermissions(roleName),
                name_lowercase: roleName.toLowerCase(),
            };
            batch.set(roleDocRef, newRole);
        });

        await batch.commit();
        toast({ title: "Default Roles Seeded", description: `${rolesToCreate.join(', ')} have been created.` });
        await loadRoles(); // Refresh roles list
    } catch (error: any) {
        console.error("Error seeding default roles:", error);
        toast({ variant: "destructive", title: "Seeding Failed", description: error.message || "Could not seed default roles." });
    } finally {
        setIsSeedingRoles(false);
    }
  };


  const handleAddRoleClick = () => {
    setSelectedRole(null);
    setIsFormOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  const handleDeleteRoleAttempt = async (role: Role) => {
    if (PROTECTED_ROLES_LOWERCASE.includes(role.name.toLowerCase())) {
        toast({ variant: "destructive", title: "Action Not Allowed", description: `The default role "${role.name}" cannot be deleted.` });
        return;
    }

    setIsLoading(true); // Show loading state for the check
    const roleInUse = await isRoleInUse(role.name);
    setIsLoading(false); // Hide loading state after check

    if (roleInUse) {
        toast({ variant: "destructive", title: "Role In Use", description: `The "${role.name}" role is currently assigned to users and cannot be deleted.` });
        return;
    }

    setRoleToDelete(role);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete || !roleToDelete.id) return;
    
    if (PROTECTED_ROLES_LOWERCASE.includes(roleToDelete.name.toLowerCase())) {
        toast({ variant: "destructive", title: "Action Not Allowed", description: `The default role "${roleToDelete.name}" cannot be deleted.` });
        setIsDeleteDialogOpen(false);
        setRoleToDelete(null);
        return;
    }
    
    setIsLoading(true); // For the delete operation
    const roleInUse = await isRoleInUse(roleToDelete.name); // Final check before delete
    if (roleInUse) {
        toast({ variant: "destructive", title: "Role In Use", description: `The "${roleToDelete.name}" role is currently assigned to users and cannot be deleted.` });
        setIsLoading(false);
        setIsDeleteDialogOpen(false);
        setRoleToDelete(null);
        return;
    }

    try {
      await deleteDoc(doc(db, "roles", roleToDelete.id));
      setRoles(prevRoles => prevRoles.filter(r => r.id !== roleToDelete.id));
      toast({ title: "Role Deleted", description: `Role "${roleToDelete.name}" has been removed.` });
    } catch (error: any) {
      console.error("Error deleting role:", error);
      toast({ variant: "destructive", title: "Delete Failed", description: error.message || "Could not delete role." });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleFormSubmit = async (formData: Omit<Role, 'id'> & { name_lowercase?: string }, originalRoleId?: string) => {
    setIsLoading(true);
    try {
      const dataToSave = { ...formData };
      if (!dataToSave.name_lowercase) {
        dataToSave.name_lowercase = dataToSave.name.toLowerCase();
      }

      if (originalRoleId) { 
        const roleDocRef = doc(db, "roles", originalRoleId);
        await updateDoc(roleDocRef, dataToSave);
        toast({ title: "Role Updated", description: `Role "${formData.name}" has been successfully updated.` });
      } else { 
        const rolesCol = collection(db, "roles");
        await addDoc(rolesCol, dataToSave);
        toast({ title: "Role Created", description: `Role "${formData.name}" has been successfully added.` });
      }
      await loadRoles(); 
    } catch (error: any) {
      console.error("Error submitting role form:", error);
      toast({ variant: "destructive", title: "Submission Failed", description: error.message || "Could not save role." });
      throw error; 
    } finally {
      setIsLoading(false);
    }
  };

  const columns = defineRoleColumns({
    onEdit: handleEditRole,
    onDelete: handleDeleteRoleAttempt,
    protectedRoles: PROTECTED_ROLES_LOWERCASE,
  });

  const allDefaultRolesExist = PROTECTED_ROLES.every(pr => roles.some(r => r.name.toLowerCase() === pr.toLowerCase()));

  if (isLoading && roles.length === 0) {
    return (
      <div className="container mx-auto py-2 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <ShieldCheck className="w-8 h-8 mr-3 text-primary" /> Role Management
        </h1>
        <div className="flex gap-2">
            {!allDefaultRolesExist && (
                <Button onClick={handleSeedDefaultRoles} variant="outline" disabled={isSeedingRoles}>
                    {isSeedingRoles ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    Seed Default Roles
                </Button>
            )}
            <Button onClick={handleAddRoleClick}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Custom Role
            </Button>
        </div>
      </div>
      <Alert className="mb-6">
        <Info className="h-5 w-5" />
        <AlertTitle>Role Management Guide</AlertTitle>
        <AlertDescription className="space-y-1">
          <p>Define and manage user roles and their associated permissions.</p>
          <p>
            <strong>Default Roles:</strong> It is highly recommended to have "Administrator", "Editor", and "User" roles.
            If they don't exist, use the "Seed Default Roles" button to create them with standard permissions.
            These default roles cannot be deleted, and their names cannot be changed.
          </p>
          <ul className="list-disc list-inside text-sm pl-2">
            <li><strong>Administrator:</strong> Full control over all system aspects (users, roles, services, subscriptions).</li>
            <li><strong>Editor:</strong> Can manage service configurations (CRUD) and update user profiles (excluding Administrators/Editors and cannot delete users or assign Administrator role).</li>
            <li><strong>User:</strong> Can access services they are enabled for (read-only access to features based on their subscription/enabled services).</li>
          </ul>
          <p>Roles cannot be deleted if they are currently assigned to any user.</p>
        </AlertDescription>
      </Alert>
      <RolesDataTable columns={columns} data={roles} />
      <RoleFormDialog
        role={selectedRole}
        onFormSubmit={handleFormSubmit}
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the role "{roleToDelete?.name}".
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setRoleToDelete(null); setIsLoading(false); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRole} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
