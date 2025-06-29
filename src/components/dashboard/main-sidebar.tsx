
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Rocket, LayoutDashboard, Users, ShieldCheck, Layers, UserCircle, Settings as SettingsIcon, LifeBuoy, Wrench, Package, FileCode } from "lucide-react"; // Added FileCode
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";


const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "My Profile", icon: UserCircle },
  { href: "/dashboard/my-services", label: "My Services", icon: Layers },
];

const adminNavItems = [
  { href: "/dashboard/admin/users", label: "User Management", icon: Users, requiredRole: "Administrator" },
  { href: "/dashboard/admin/roles", label: "Role Management", icon: ShieldCheck, requiredRole: "Administrator" },
  { href: "/dashboard/admin/services", label: "Service", icon: Wrench, requiredRole: "Administrator" },
  { href: "/dashboard/admin/subscriptions", label: "Subscription", icon: Package, requiredRole: "Administrator" },
];

const helpNavItems = [
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
  { href: "/docs", label: "Documentation", icon: FileCode }, // Changed from /docs/api to /docs
]

export function MainSidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth(); 

  const visibleAdminNavItems = isAdmin ? adminNavItems : [];


  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <Rocket className="h-7 w-7 text-primary transition-transform duration-300 group-hover:rotate-[15deg]" />
          <span className="text-xl font-headline font-semibold text-primary group-data-[collapsible=icon]:hidden">
            Ozarnia Hub
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                tooltip={item.label}
                className={cn(
                  "justify-start",
                  (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))) && "bg-primary/10 text-primary hover:bg-primary/15"
                )}
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {visibleAdminNavItems.length > 0 && (
          <>
            <SidebarSeparator className="my-4" />
            <SidebarGroup>
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Administration</SidebarGroupLabel>
              <SidebarMenu>
                {visibleAdminNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                      tooltip={item.label}
                      className={cn(
                        "justify-start",
                        pathname.startsWith(item.href) && "bg-primary/10 text-primary hover:bg-primary/15"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-5 w-5" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t">
         <SidebarMenu>
            {helpNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                  className={cn(
                    "justify-start",
                      pathname.startsWith(item.href) && "bg-primary/10 text-primary hover:bg-primary/15"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
