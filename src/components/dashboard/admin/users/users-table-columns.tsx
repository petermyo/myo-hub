
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { format } from 'date-fns';
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation"; // Import useRouter

interface UsersTableColumnsProps {
  onEdit: (user: User) => void; // This can be kept for quick edit in dialog if needed, or repurposed
  onDelete: (user: User) => void;
  // onViewDetails: (user: User) => void; // Will be replaced by direct navigation
}

export const columns = ({ onEdit, onDelete }: UsersTableColumnsProps): ColumnDef<User>[] => {
  const { currentUser: performingUser } = useAuth();
  const router = useRouter(); // Initialize router

  const handleViewDetails = (user: User) => {
    router.push(`/dashboard/admin/users/${user.uid}`);
  };

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            User
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const user = row.original;
        const avatarUrl = user.avatarUrl || `https://placehold.co/100x100.png?text=${user.name ? user.name.charAt(0).toUpperCase() : 'U'}`;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatarUrl} alt={user.name} data-ai-hint="profile person" />
              <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{user.name || "N/A"}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        if (!role || role.trim() === "") {
          return <Badge variant="destructive">Role Not Assigned</Badge>;
        }
        return <Badge variant="outline">{role}</Badge>;
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        let badgeClass = "";
        switch (status) {
          case "active":
            badgeClass = "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700";
            break;
          case "inactive":
            badgeClass = "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700";
            break;
          case "pending":
            badgeClass = "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700";
            break;
          default:
            badgeClass = "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700";
        }
        return (
          <Badge variant={"outline"} className={badgeClass}>
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => {
        const date = row.getValue("createdAt");
        try {
          return <span>{date ? format(new Date(date as string), "PP") : 'N/A'}</span>;
        } catch (e) {
          return <span>Invalid Date</span>;
        }
      },
    },
    {
      accessorKey: "lastLogin",
      header: "Last Login",
      cell: ({ row }) => {
        const date = row.getValue("lastLogin");
        try {
          return <span>{date ? format(new Date(date as string), "PPp") : 'N/A'}</span>;
        } catch (e) {
           return <span>N/A</span>;
        }
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        const isSelf = performingUser?.uid === user.uid;
        const performingUserRole = performingUser?.role;

        let canEditInDialog = false; // For quick edit dialog, if still used
        let canDelete = false;

        if (performingUserRole === "Administrator") {
          canEditInDialog = true; 
          canDelete = !isSelf; 
        } else if (performingUserRole === "Editor") {
          canEditInDialog = !isSelf && user.role !== "Administrator" && user.role !== "Editor";
          canDelete = false;
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                <Eye className="mr-2 h-4 w-4" />
                View/Edit Details
              </DropdownMenuItem>
              {/* Optional: Keep quick edit via dialog if 'onEdit' is still relevant */}
              {/* {canEditInDialog ? (
                <DropdownMenuItem onClick={() => onEdit(user)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Quick Edit
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled>
                  <Edit className="mr-2 h-4 w-4" />
                  Quick Edit (Restricted)
                </DropdownMenuItem>
              )} */}
              <DropdownMenuSeparator />
              {canDelete ? (
                <DropdownMenuItem onClick={() => onDelete(user)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </DropdownMenuItem>
              ) : (
                 <DropdownMenuItem disabled>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete User (Restricted)
                 </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
