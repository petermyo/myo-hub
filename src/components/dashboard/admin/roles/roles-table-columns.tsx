
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Role } from "@/types";
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
import { ArrowUpDown, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RolesTableColumnsProps {
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  protectedRoles: string[]; // lowercase names of protected roles
}

export const columns = ({ onEdit, onDelete, protectedRoles }: RolesTableColumnsProps): ColumnDef<Role>[] => [
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
          Role Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
        const roleName = row.getValue("name") as string;
        const isProtected = protectedRoles.includes(roleName.toLowerCase());
        return (
            <div className="font-medium flex items-center">
                {roleName}
                {isProtected && <Badge variant="outline" className="ml-2 text-xs border-yellow-500 text-yellow-700">Protected</Badge>}
            </div>
        );
    }
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <div className="text-muted-foreground truncate max-w-xs">{row.getValue("description")}</div>,
  },
  {
    accessorKey: "permissions",
    header: "Permissions Count",
    cell: ({ row }) => {
      const permissions = row.getValue("permissions") as string[];
      if (permissions && permissions.includes("global:full_access")) {
        return <Badge variant="default">Full Access</Badge>;
      }
      return <Badge variant="secondary">{permissions?.length || 0} assigned</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const role = row.original;
      const isProtectedRole = protectedRoles.includes(role.name.toLowerCase());

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
            <DropdownMenuItem onClick={() => onEdit(role)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Role
            </DropdownMenuItem>
            {!isProtectedRole && ( 
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(role)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Role
                </DropdownMenuItem>
              </>
            )}
            {isProtectedRole && (
                 <DropdownMenuItem disabled>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cannot Delete (Protected Role)
                 </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
