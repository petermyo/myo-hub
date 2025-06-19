
"use client";

import { useState, useEffect, useCallback } from "react";
import { columns as defineColumns } from "@/components/dashboard/admin/users/users-table-columns";
import { UsersDataTable } from "@/components/dashboard/admin/users/users-data-table";
import { UserFormDialog } from "@/components/dashboard/admin/users/user-form-dialog";
import { Button } from "@/components/ui/button";
import type { User, Role as AppRole } from "@/types";
import { PlusCircle, Users as UsersIcon, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth"; // For Admin user creation
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"


async function fetchUsersFromFirestore(): Promise<User[]> {
  const usersCol = collection(db, "users");
  const userSnapshot = await getDocs(usersCol);
  const userList = userSnapshot.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() } as User));
  return userList;
}

async function fetchRolesFromFirestore(): Promise<AppRole[]> {
  const rolesCol = collection(db, "roles");
  const roleSnapshot = await getDocs(rolesCol);
  const roleList = roleSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as AppRole));
  // Filter out roles that might not have a name (though they should)
  return roleList.filter(role => role.name);
}


export default function AdminUsersPage() {
  const [data, setData] = useState<User[]>([]);
  const [availableRoles, setAvailableRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { toast } = useToast();
  const { currentUser: performingUser, isAdmin: performingUserIsAdmin } = useAuth();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [users, roles] = await Promise.all([
        fetchUsersFromFirestore(),
        fetchRolesFromFirestore()
      ]);
      setData(users);
      setAvailableRoles(roles);
    } catch (error: any) {
      console.error("Error fetching users or roles:", error);
      let description = "Could not fetch users or roles.";
      if (error.message) {
        description += ` Message: ${error.message}`;
      }
      if (error.code) {
        description += ` Code: ${error.code}`;
      }
      toast({ variant: "destructive", title: "Error Loading Data", description });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddUserClick = () => {
    if (!performingUserIsAdmin) {
        toast({ variant: "destructive", title: "Action Not Allowed", description: "Only Administrators can add new users." });
        return;
    }
    setSelectedUser(null);
    setIsFormOpen(true);
  };
  
  const handleEditUser = (user: User) => {
    // Admin can edit anyone.
    // Editor cannot edit Administrator or other Editor roles.
    if (performingUser?.role === "Editor" && (user.role === "Administrator" || user.role === "Editor")) {
        toast({ variant: "destructive", title: "Action Not Allowed", description: "Editors cannot edit Administrator or other Editor accounts." });
        return;
    }
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteUserAttempt = (user: User) => {
    if (user.uid === performingUser?.uid) {
        toast({ variant: "destructive", title: "Action Not Allowed", description: "You cannot delete your own account." });
        return;
    }
    // Editors cannot delete any users.
    if (performingUser?.role === "Editor") {
        toast({ variant: "destructive", title: "Action Not Allowed", description: "Editors do not have permission to delete users." });
        return;
    }
    // Only Administrators can delete other Administrator accounts.
    if (user.role === "Administrator" && !performingUserIsAdmin) {
         toast({ variant: "destructive", title: "Action Not Allowed", description: "Only Administrators can delete other Administrator accounts." });
        return;
    }

    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || !userToDelete.uid) return;
    
    // Double-check permissions before actual deletion
    if (userToDelete.uid === performingUser?.uid || 
        (performingUser?.role === "Editor") || // Editors cannot delete
        (userToDelete.role === "Administrator" && !performingUserIsAdmin)
    ) {
        toast({ variant: "destructive", title: "Action Not Allowed", description: "Permission to delete this user was denied." });
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
        return;
    }

    setIsLoading(true);
    try {
      // Deleting the Firestore document.
      // Firebase Auth user record must be deleted separately using Admin SDK (e.g., in a Firebase Function)
      // for a complete user removal. This client-side action won't delete the Auth user.
      await deleteDoc(doc(db, "users", userToDelete.uid));
      console.warn(`Firestore document for user ${userToDelete.uid} (${userToDelete.email}) deleted. The corresponding Firebase Auth user record must be deleted separately using the Admin SDK in a backend environment to fully remove the user from Firebase Authentication.`);
      setData(prevData => prevData.filter(u => u.uid !== userToDelete.uid));
      toast({ title: "User Document Deleted", description: `Firestore record for ${userToDelete.name || userToDelete.email} has been removed.` });
    } catch (error: any) {
      console.error("Error deleting user Firestore document:", error);
      toast({ variant: "destructive", title: "Delete Failed", description: error.message || "Could not delete user's Firestore document." });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleFormSubmit = async (formData: Partial<User> & { password?: string }, originalUserUid?: string) => {
    setIsLoading(true);
    try {
      if (originalUserUid) { // Editing existing user
        const userToEdit = data.find(u => u.uid === originalUserUid);
        if (!userToEdit) throw new Error("User to edit not found.");

        if (performingUser?.role === "Editor" && (userToEdit.role === "Administrator" || userToEdit.role === "Editor")) {
            throw new Error("Editors cannot modify Administrator or other Editor accounts.");
        }
        if (performingUser?.role === "Editor" && formData.role === "Administrator") {
            throw new Error("Editors cannot assign the Administrator role.");
        }
        
        const userDocRef = doc(db, "users", originalUserUid);
        const fieldsToUpdate: Pick<User, 'name' | 'role' | 'status'> = {
            name: formData.name || userToEdit.name,
            role: formData.role || userToEdit.role, // Role can be changed by Admin, or by Editor if not to/from Admin/Editor
            status: formData.status || userToEdit.status
        };
        // Email is not directly updatable here as it involves Firebase Auth changes.
        await updateDoc(userDocRef, fieldsToUpdate);
        toast({ title: "User Updated", description: `${fieldsToUpdate.name} has been successfully updated.` });
      } else { // Adding new user (Only Admin can do this)
        if (!performingUserIsAdmin) {
            throw new Error("Only Administrators can create new users.");
        }
        if (!formData.password || !formData.email) {
            throw new Error("Email and password are required for new users.");
        }
        // Admin creates user via Firebase Auth SDK directly (requires careful setup for admin privileges if not using Admin SDK)
        // For simplicity here, we assume client-side creation by an Admin is allowed for now by Firebase rules
        // In a production app, this should ideally be an Admin SDK call from a backend/function.
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const firebaseUser = userCredential.user;
        
        const newUserDoc: User = {
          uid: firebaseUser.uid,
          name: formData.name || "Unnamed User",
          email: firebaseUser.email!,
          role: formData.role || "User", // Default to "User" if not specified
          status: formData.status || "active",
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(), 
          enabledServices: [],
          avatarUrl: `https://placehold.co/100x100.png?text=${(formData.name || "U").charAt(0).toUpperCase()}`,
        };
        await setDoc(doc(db, "users", firebaseUser.uid), newUserDoc);
        toast({ title: "User Created", description: `${newUserDoc.name} has been successfully added.` });
      }
      await loadData(); 
    } catch (error: any) {
        console.error("Error submitting user form:", error);
        toast({
          variant: "destructive",
          title: "Operation Failed",
          description: error.message || `Could not ${originalUserUid ? 'update' : 'create'} user.`,
        });
        throw error; // Re-throw to prevent dialog from closing on error
    } finally {
      setIsLoading(false);
    }
  };
  
  const columns = defineColumns({ 
    onEdit: handleEditUser, 
    onDelete: handleDeleteUserAttempt, 
    onViewDetails: (user) => console.log("View details for:", user.name) 
  });


  if (isLoading && data.length === 0) { 
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
          <UsersIcon className="w-8 h-8 mr-3 text-primary" /> User Management
        </h1>
        {performingUserIsAdmin && ( // Only Admins can add users
          <Button onClick={handleAddUserClick}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add User
          </Button>
        )}
      </div>
      <p className="text-muted-foreground mb-6">
        View, manage, and edit user accounts. Assign roles and manage access. Editors have restricted update capabilities and cannot delete or create users.
      </p>
      <UsersDataTable columns={columns} data={data} />
      {isFormOpen && (
        <UserFormDialog
            user={selectedUser}
            onFormSubmit={handleFormSubmit}
            isOpen={isFormOpen}
            setIsOpen={setIsFormOpen}
            availableRoles={availableRoles.map(r => ({id: r.name, name: r.name}))} // Ensure 'name' is used as ID for SelectItem value
            currentUserRole={performingUser?.role}
        />
      )}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the user&apos;s Firestore document
              for {userToDelete?.name || userToDelete?.email}. Deleting the corresponding Firebase Authentication user record
              must be done separately (e.g., using the Firebase Admin SDK in a backend environment).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setUserToDelete(null); setIsLoading(false);}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Firestore Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
