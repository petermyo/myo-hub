"use client"; // Required for useState, useEffect, and client components like TanStack Table

import { useState, useEffect } from "react";
import { columns } from "@/components/dashboard/admin/users/users-table-columns";
import { UsersDataTable } from "@/components/dashboard/admin/users/users-data-table";
import { UserFormDialog } from "@/components/dashboard/admin/users/user-form-dialog";
import { Button } from "@/components/ui/button";
import type { User } from "@/types";
import { PlusCircle, Users as UsersIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Dummy data fetching function
async function getUsers(): Promise<User[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return [
    { id: "1", name: "Alice Wonderland", email: "alice@example.com", role: "Administrator", status: "active", createdAt: "2023-01-15T10:00:00Z", lastLogin: "2024-07-20T14:30:00Z", avatarUrl: "https://placehold.co/100x100.png?text=AW" },
    { id: "2", name: "Bob The Builder", email: "bob@example.com", role: "Editor", status: "active", createdAt: "2023-02-20T11:00:00Z", lastLogin: "2024-07-19T09:15:00Z", avatarUrl: "https://placehold.co/100x100.png?text=BB" },
    { id: "3", name: "Charlie Brown", email: "charlie@example.com", role: "User", status: "inactive", createdAt: "2023-03-10T12:00:00Z", avatarUrl: "https://placehold.co/100x100.png?text=CB" },
    { id: "4", name: "Diana Prince", email: "diana@example.com", role: "User", status: "pending", createdAt: "2024-07-21T08:00:00Z", avatarUrl: "https://placehold.co/100x100.png?text=DP" },
  ];
}

export default function AdminUsersPage() {
  const [data, setData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const users = await getUsers();
      setData(users);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  // This would be a real API call
  const handleFormSubmit = async (user: User) => {
    console.log("Submitting user:", user);
    // Simulate API interaction
    await new Promise(resolve => setTimeout(resolve, 500));
    if (selectedUser) { // Editing existing user
      setData(prevData => prevData.map(u => u.id === user.id ? user : u));
    } else { // Adding new user
      setData(prevData => [...prevData, user]);
    }
    setIsFormOpen(false); // Close dialog via UserFormDialog's internal state management
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
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
        {/* UserFormDialog can manage its own open state via its trigger */}
        <UserFormDialog
            user={null} // For adding new user
            onFormSubmit={handleFormSubmit}
            triggerButton={
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add User
                </Button>
            }
        />
      </div>
      <p className="text-muted-foreground mb-6">
        View, manage, and edit user accounts. You can assign roles and manage access.
      </p>
      <UsersDataTable columns={columns} data={data} onAddUser={handleAddUser} />
    </div>
  );
}
