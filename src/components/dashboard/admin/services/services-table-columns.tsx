
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Service } from "@/types";
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
import { ArrowUpDown, MoreHorizontal, Edit, Trash2, Link as LinkIconLucide, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";

type IconName = keyof typeof LucideIcons;

const renderLucideIcon = (iconName: string, props?: LucideIcons.LucideProps) => {
  const IconComponent = LucideIcons[iconName as IconName] as LucideIcons.LucideIcon | undefined;
  if (!IconComponent) {
    return <LucideIcons.Settings className="w-4 h-4 text-muted-foreground" {...props} />; // Fallback icon
  }
  return <IconComponent className="w-4 h-4" {...props} />;
};


interface ServicesTableColumnsProps {
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

export const columns = ({ onEdit, onDelete }: ServicesTableColumnsProps): ColumnDef<Service>[] => [
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
          Service Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
        const service = row.original;
        return (
            <div className="flex items-center gap-2">
                {renderLucideIcon(service.icon, { className: "text-primary"})}
                <span className="font-medium">{service.name}</span>
            </div>
        )
    }
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => <Badge variant="secondary">{row.getValue("slug")}</Badge>,
  },
  {
    accessorKey: "url",
    header: "URL",
    cell: ({ row }) => {
        const url = row.getValue("url") as string;
        return (
            <a href={`https://${url}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                <Globe className="w-3 h-3"/> {url}
            </a>
        )
    }
  },
  {
    accessorKey: "linkedSubscriptionIds",
    header: "Linked Subscriptions",
    cell: ({ row }) => {
      const ids = row.original.linkedSubscriptionIds;
      return ids && ids.length > 0 ? (
        <Badge variant="outline">{ids.length} Plan(s)</Badge>
      ) : (
        <span className="text-muted-foreground text-xs">None</span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const service = row.original;
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
            <DropdownMenuItem onClick={() => onEdit(service)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Service
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(service)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Service
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
