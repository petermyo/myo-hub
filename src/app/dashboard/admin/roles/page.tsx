
"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusCircle, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Role } from "@/types";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, where } from "firebase/firestore";
import { RolesDataTable } from "@/components/dashboard/admin/roles/roles-data-table";
import { columns as defineRoleColumns } from "@/components/dashboard/admin/roles/roles-table-columns";
import { RoleFormDialog } from "@/components/dashboard/admin/roles/role-form-dialog";
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

async function fetchRolesFromFirestore(): Promise<Role[]> {
  const rolesCol = collection(db, "roles");
  const roleSnapshot = await getDocs(rolesCol);
  const roleList = roleSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Role));
  return roleList;
}

// Helper function to check if a role is in use
async function isRoleInUse(roleName: string): Promise<boolean> {
  const usersCol = collection(db, "users");
  const q = query(usersCol, where("role", "==", roleName));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}


export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch roles." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleAddRoleClick = () => {
    setSelectedRole(null);
    setIsFormOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  const handleDeleteRoleAttempt = async (role: Role) => {
    const protectedRoles = ["administrator", "editor", "user"];
    if (protectedRoles.includes(role.name.toLowerCase())) {
        toast({ variant: "destructive", title: "Action Not Allowed", description: `The "${role.name}" role cannot be deleted.` });
        return;
    }

    setIsLoading(true);
    const roleInUse = await isRoleInUse(role.name);
    setIsLoading(false);

    if (roleInUse) {
        toast({ variant: "destructive", title: "Role In Use", description: `The "${role.name}" role is currently assigned to users and cannot be deleted.` });
        return;
    }

    setRoleToDelete(role);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete || !roleToDelete.id) return;
    
    // Double check protected roles (already checked in handleDeleteRoleAttempt, but good for safety)
    const protectedRoles = ["administrator", "editor", "user"];
    if (protectedRoles.includes(roleToDelete.name.toLowerCase())) {
        toast({ variant: "destructive", title: "Action Not Allowed", description: `The "${roleToDelete.name}" role cannot be deleted.` });
        setIsDeleteDialogOpen(false);
        setRoleToDelete(null);
        return;
    }
    
    // Double check if role is in use (already checked, but good for safety)
    setIsLoading(true); // Indicate loading for the delete operation
    const roleInUse = await isRoleInUse(roleToDelete.name);
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

  const handleFormSubmit = async (formData: Omit<Role, 'id'>, originalRoleId?: string) => {
    setIsLoading(true);
    try {
      if (originalRoleId) { // Editing existing role
        const roleDocRef = doc(db, "roles", originalRoleId);
        await updateDoc(roleDocRef, formData);
        toast({ title: "Role Updated", description: `Role "${formData.name}" has been successfully updated.` });
      } else { // Adding new role
        const rolesCol = collection(db, "roles");
        await addDoc(rolesCol, formData);
        toast({ title: "Role Created", description: `Role "${formData.name}" has been successfully added.` });
      }
      await loadRoles(); // Refresh data
    } catch (error: any) {
      console.error("Error submitting role form:", error);
      toast({ variant: "destructive", title: "Submission Failed", description: error.message || "Could not save role." });
      throw error; // Re-throw to allow form dialog to handle its own loading state
    } finally {
      setIsLoading(false);
    }
  };

  const columns = defineRoleColumns({
    onEdit: handleEditRole,
    onDelete: handleDeleteRoleAttempt,
  });

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
        <Button onClick={handleAddRoleClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Role
        </Button>
      </div>
      <p className="text-muted-foreground mb-6">
        Define and manage user roles and their associated permissions. Default roles (Administrator, Editor, User) cannot be deleted or have their names changed. Roles cannot be deleted if they are in use by any user.
      </p>
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
