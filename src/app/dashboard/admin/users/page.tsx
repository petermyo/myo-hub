
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
import { createUserWithEmailAndPassword } from "firebase/auth";
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
  return roleList;
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
    setSelectedUser(null);
    setIsFormOpen(true);
  };
  
  const handleEditUser = (user: User) => {
    if (performingUser?.role === "Editor" && user.role === "Administrator") {
        toast({ variant: "destructive", title: "Action Not Allowed", description: "Editors cannot edit Administrator accounts." });
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
    if (performingUser?.role === "Editor" && (user.role === "Administrator" || user.role === "Editor")) {
        toast({ variant: "destructive", title: "Action Not Allowed", description: "Editors cannot delete Administrator or other Editor accounts." });
        return;
    }
    if (user.role === "Administrator" && !performingUserIsAdmin) {
         toast({ variant: "destructive", title: "Action Not Allowed", description: "Only Administrators can delete other Administrator accounts." });
        return;
    }

    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || !userToDelete.uid) return;
    
    if (userToDelete.uid === performingUser?.uid || 
        (performingUser?.role === "Editor" && (userToDelete.role === "Administrator" || userToDelete.role === "Editor")) ||
        (userToDelete.role === "Administrator" && !performingUserIsAdmin)
    ) {
        toast({ variant: "destructive", title: "Action Not Allowed", description: "Permission to delete this user was denied." });
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
        return;
    }

    setIsLoading(true);
    try {
      // IMPORTANT: Deleting the Firebase Auth user record typically requires the Admin SDK (e.g., in a Firebase Function).
      // This client-side operation only deletes the Firestore document.
      await deleteDoc(doc(db, "users", userToDelete.uid));
      console.warn(`Firestore document for user ${userToDelete.uid} deleted. Corresponding Firebase Auth user record must be deleted separately if you want to fully remove the user from Firebase Authentication.`);
      setData(prevData => prevData.filter(u => u.uid !== userToDelete.uid));
      toast({ title: "User Document Deleted", description: `Firestore record for ${userToDelete.name} has been removed.` });
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
        if (performingUser?.role === "Editor" && userToEdit?.role === "Administrator") {
            throw new Error("Editors cannot modify Administrator accounts.");
        }
        
        const userDocRef = doc(db, "users", originalUserUid);
        // Only update fields managed by this form to avoid overwriting other data like lastLogin, createdAt etc.
        const fieldsToUpdate: Pick<User, 'name' | 'role' | 'status'> = {
            name: formData.name || (userToEdit?.name || "Unnamed User"),
            role: formData.role || (userToEdit?.role || "User"),
            status: formData.status || (userToEdit?.status || "active")
        };
        // Email is not directly updatable here; Firebase Auth handles email changes which then should be synced if necessary.
        await updateDoc(userDocRef, fieldsToUpdate);
        toast({ title: "User Updated", description: `${formData.name} has been successfully updated.` });
      } else { // Adding new user
        if (!performingUserIsAdmin) {
            throw new Error("Only Administrators can create new users.");
        }
        if (!formData.password || !formData.email) {
            throw new Error("Email and password are required for new users.");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const firebaseUser = userCredential.user;
        
        const newUserDoc: User = {
          uid: firebaseUser.uid,
          name: formData.name || "Unnamed User",
          email: firebaseUser.email!,
          role: formData.role || "User",
          status: formData.status || "active",
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(), // Set initial lastLogin
          enabledServices: [],
          avatarUrl: `https://placehold.co/100x100.png?text=${(formData.name || "U").charAt(0).toUpperCase()}`,
        };
        await setDoc(doc(db, "users", firebaseUser.uid), newUserDoc);
        toast({ title: "User Created", description: `${newUserDoc.name} has been successfully added.` });
      }
      await loadData(); // Refresh data
    } catch (error: any) {
        console.error("Error submitting user form:", error);
        toast({
          variant: "destructive",
          title: "Operation Failed",
          description: error.message || `Could not ${originalUserUid ? 'update' : 'create'} user.`,
        });
        throw error; 
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
        {performingUserIsAdmin && (
          <Button onClick={handleAddUserClick}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add User
          </Button>
        )}
      </div>
      <p className="text-muted-foreground mb-6">
        View, manage, and edit user accounts. Assign roles and manage access.
      </p>
      <UsersDataTable columns={columns} data={data} />
      {isFormOpen && (
        <UserFormDialog
            user={selectedUser}
            onFormSubmit={handleFormSubmit}
            isOpen={isFormOpen}
            setIsOpen={setIsFormOpen}
            availableRoles={availableRoles.map(r => ({id: r.name, name: r.name}))}
            currentUserRole={performingUser?.role}
        />
      )}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the user&apos;s Firestore document
              for {userToDelete?.name}. Deleting the corresponding Firebase Authentication user record
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
