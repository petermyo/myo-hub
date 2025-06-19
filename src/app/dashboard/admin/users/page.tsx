
"use client";

import { useState, useEffect, useCallback } from "react";
import { columns as defineColumns } from "@/components/dashboard/admin/users/users-table-columns";
import { UsersDataTable } from "@/components/dashboard/admin/users/users-data-table";
import { UserFormDialog } from "@/components/dashboard/admin/users/user-form-dialog";
import { Button } from "@/components/ui/button";
import type { User } from "@/types";
import { PlusCircle, Users as UsersIcon, Edit, Trash2, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword, deleteUser as deleteAuthUser } from "firebase/auth"; // Import deleteUser
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
    setIsLoading(true);
    try {
      // Note: Deleting a Firebase Auth user client-side is tricky and often requires re-authentication or backend functions.
      // This is a simplified attempt and might fail due to permissions or requiring recent login.
      // A Firebase Function is the robust way to delete auth users.
      // For now, we only delete from Firestore. If you have a backend function, call it here.
      
      // const userAuth = auth.currentUser; // This is the *admin's* auth, not the user to delete
      // If you are trying to delete other users, you typically need Admin SDK (backend).
      // This is a placeholder for Firestore deletion. Auth user deletion needs more robust handling.
      await deleteDoc(doc(db, "users", userToDelete.uid));

      // Attempt to delete auth user - THIS IS LIKELY TO FAIL WITHOUT ADMIN SDK / FUNCTIONS
      // And it's deleting the currently signed-in user if not careful.
      // This part is highly problematic from client-side for *other* users.
      // console.warn("Attempting to delete auth user client-side. This usually requires Admin SDK.");
      // For a real app, use a Firebase Function to handle deletion of auth.UserRecord and Firestore doc.

      setData(prevData => prevData.filter(u => u.uid !== userToDelete.uid));
      toast({ title: "User Deleted", description: `${userToDelete.name} has been removed.` });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({ variant: "destructive", title: "Delete Failed", description: error.message || "Could not delete user." });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };


  const handleFormSubmit = async (userData: User, originalUserUid?: string) => {
    setIsLoading(true); // Using component's isLoading for overall page state during submit
    try {
      if (originalUserUid) { // Editing existing user
        const userDocRef = doc(db, "users", originalUserUid);
        const { uid, password, confirmPassword, ...dataToUpdate } = userData; // Don't save password fields
        await updateDoc(userDocRef, {
            ...dataToUpdate,
            lastLogin: dataToUpdate.lastLogin || null // Ensure lastLogin is not undefined
        });
      } else { // Adding new user
        if (!userData.password) {
            throw new Error("Password is required for new users.");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        const firebaseUser = userCredential.user;
        
        const newUserDoc: Omit<User, 'password' | 'confirmPassword'> = {
          uid: firebaseUser.uid,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          status: userData.status || "active",
          createdAt: new Date().toISOString(),
          enabledServices: userData.enabledServices || [],
          avatarUrl: userData.avatarUrl || `https://placehold.co/100x100.png?text=${userData.name.charAt(0).toUpperCase()}`,
        };
        await setDoc(doc(db, "users", firebaseUser.uid), newUserDoc);
      }
      await loadUsers(); // Refresh data
    } catch (error: any) {
        console.error("Error submitting user form:", error);
        // Rethrow to be caught by UserFormDialog's internal error handling if preferred, or handle here.
        // For now, UserFormDialog handles its own toast.
        throw error; // Let UserFormDialog handle its toast
    } finally {
      setIsLoading(false);
    }
  };
  
  const columns = defineColumns({ onEdit: handleEditUser, onDelete: handleDeleteUserAttempt, onViewDetails: (user) => console.log("View details for:", user.name) });


  if (isLoading && data.length === 0) { // Initial load
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
        // No trigger button here as we trigger it programmatically
      />
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              for {userToDelete?.name} and remove their data from our servers. 
              Deleting the authentication record may fail if not run via Admin SDK.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
