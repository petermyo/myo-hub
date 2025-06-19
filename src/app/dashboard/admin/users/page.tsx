
"use client";

import { useState, useEffect, useCallback } from "react";
import { columns as defineColumns } from "@/components/dashboard/admin/users/users-table-columns";
import { UsersDataTable } from "@/components/dashboard/admin/users/users-data-table";
import { UserFormDialog } from "@/components/dashboard/admin/users/user-form-dialog";
import { Button } from "@/components/ui/button";
import type { User } from "@/types";
import { PlusCircle, Users as UsersIcon, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
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

export default function AdminUsersPage() {
  const [data, setData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { toast } = useToast();

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const users = await fetchUsersFromFirestore();
      setData(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch users." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleAddUserClick = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteUserAttempt = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || !userToDelete.uid) return;
    setIsLoading(true); // Use page-level loading state for delete operation
    try {
      // Delete user document from Firestore
      await deleteDoc(doc(db, "users", userToDelete.uid));
      
      // IMPORTANT: Deleting a Firebase Auth user client-side for *another user* is NOT recommended or typically possible
      // without Admin SDK privileges (which are not available in the client).
      // A Firebase Function triggered by the Firestore document deletion (or an explicit call)
      // is the robust way to delete the corresponding Firebase Auth user.
      // The code to attempt auth.deleteUser() is omitted here as it's for the *current* user
      // and would require re-authentication for the user being deleted if it were them.
      console.warn(`Firestore document for user ${userToDelete.uid} deleted. Corresponding Firebase Auth user record must be deleted separately (e.g., via Admin SDK / Firebase Function).`);

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
    // formData contains: uid (if editing), name, email, role, and password (if adding)
    // It's a Partial<User> because UserFormDialog only sends fields it manages.
    setIsLoading(true);
    try {
      if (originalUserUid) { // Editing existing user
        const userDocRef = doc(db, "users", originalUserUid);
        // Only update fields managed by the form: name, email, role.
        // Other fields like createdAt, lastLogin, avatarUrl, enabledServices, status are not changed here
        // to prevent accidental overwrites if they are managed elsewhere or not part of this specific form.
        // Note: Changing email in Firebase Auth for another user is complex from client-side and usually requires Admin SDK.
        // This update only affects the Firestore email field.
        const fieldsToUpdate: Partial<User> = {
            name: formData.name,
            email: formData.email,
            role: formData.role,
        };
        await updateDoc(userDocRef, fieldsToUpdate);
        toast({ title: "User Updated", description: `${formData.name} has been successfully updated.` });
      } else { // Adding new user
        if (!formData.password || !formData.email) {
            throw new Error("Email and password are required for new users.");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const firebaseUser = userCredential.user;
        
        const newUserDoc: Omit<User, 'password' | 'confirmPassword' | 'lastLogin' | 'subscriptionPlanId'> = {
          uid: firebaseUser.uid,
          name: formData.name || "Unnamed User",
          email: firebaseUser.email!, // Email is guaranteed from createUserWithEmailAndPassword
          role: formData.role || "User",
          status: "active", // Default status for new users created by admin
          createdAt: new Date().toISOString(),
          enabledServices: [], // Default for new users
          avatarUrl: `https://placehold.co/100x100.png?text=${(formData.name || "U").charAt(0).toUpperCase()}`,
        };
        await setDoc(doc(db, "users", firebaseUser.uid), newUserDoc);
        toast({ title: "User Created", description: `${newUserDoc.name} has been successfully added.` });
      }
      await loadUsers(); // Refresh data
    } catch (error: any) {
        console.error("Error submitting user form:", error);
        // UserFormDialog handles its own toast on error by re-throwing
        throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const columns = defineColumns({ 
    onEdit: handleEditUser, 
    onDelete: handleDeleteUserAttempt, 
    onViewDetails: (user) => console.log("View details for:", user.name) // Placeholder for view details
  });


  if (isLoading && data.length === 0) { // Initial load skeleton
    return (
      <div className="container mx-auto py-2 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <div className="flex justify-end gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <UsersIcon className="w-8 h-8 mr-3 text-primary" /> User Management
        </h1>
        <Button onClick={handleAddUserClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>
      <p className="text-muted-foreground mb-6">
        View, manage, and edit user accounts. You can assign roles and manage access.
      </p>
      <UsersDataTable columns={columns} data={data} />
      <UserFormDialog
        user={selectedUser}
        onFormSubmit={handleFormSubmit}
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
      />
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user&apos;s Firestore document
              for {userToDelete?.name}. Deleting the corresponding Firebase Authentication user record
              must be done separately, typically using the Firebase Admin SDK (e.g., via a Firebase Function).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
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

