"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, UserCircle, Settings, LayoutDashboard, SidebarOpen } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar"; // Assuming this hook exists from shadcn sidebar
import { usePathname, useRouter } from "next/navigation";

export function MainHeader() {
  // const { toggleSidebar, isMobile } = useSidebar(); // If using shadcn sidebar's context
  // Placeholder for sidebar toggle if needed. For now, we assume it's part of Sidebar component.
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    // Perform logout logic here
    console.log("User logged out");
    router.push("/auth/login");
  };

  const userName = "Demo User"; // Replace with actual user name
  const userEmail = "demo@example.com"; // Replace with actual user email
  const userAvatar = "https://placehold.co/100x100.png"; // Replace with actual avatar URL

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      {/* 
      // Example of sidebar toggle button if needed from a custom hook
      {isMobile && (
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
          <SidebarOpen className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      )}
      */}
      <div className="flex-1">
        <h1 className="text-xl font-semibold capitalize">
          {pathname.split("/").pop()?.replace('-', ' ') || "Dashboard"}
        </h1>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={userAvatar} alt={userName} data-ai-hint="profile person" />
              <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile">
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
