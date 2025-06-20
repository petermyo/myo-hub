
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, User as UserIcon, Loader2, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import type { User, Role as AppRole, Service } from "@/types";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { UserServiceToggleList } from "@/components/dashboard/services/user-service-toggle-list"; // Re-using this

async function fetchUserFromFirestore(uid: string): Promise<User | null> {
  if (!uid) return null;
  const userDocRef = doc(db, "users", uid);
  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists()) {
    return { uid: docSnap.id, ...docSnap.data() } as User;
  }
  return null;
}

async function fetchAllRolesFromFirestore(): Promise<AppRole[]> {
  const rolesCol = collection(db, "roles");
  const roleSnapshot = await getDocs(rolesCol);
  return roleSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as AppRole)).filter(role => role.name);
}

export default function AdminUserEditPage() {
  const router = useRouter();
  const params = useParams();
  const uid = params.uid as string;

  const { currentUser: performingUser, isAdmin: performingUserIsAdmin } = useAuth();
  const { toast } = useToast();

  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [editableName, setEditableName] = useState("");
  const [editableRole, setEditableRole] = useState("");
  const [editableStatus, setEditableStatus] = useState<User["status"]>("pending");
  const [availableRoles, setAvailableRoles] = useState<AppRole[]>([]);
  
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const loadUserData = useCallback(async () => {
    if (!uid) return;
    setIsLoadingUser(true);
    setError(null);
    try {
      const [user, roles] = await Promise.all([
        fetchUserFromFirestore(uid),
        fetchAllRolesFromFirestore()
      ]);

      if (user) {
        setTargetUser(user);
        setEditableName(user.name);
        setEditableRole(user.role);
        setEditableStatus(user.status);
      } else {
        setError("User not found.");
        toast({ variant: "destructive", title: "Error", description: "User not found." });
      }
      setAvailableRoles(roles);
    } catch (e: any) {
      console.error("Error loading user data for admin edit:", e);
      setError("Failed to load user data.");
      toast({ variant: "destructive", title: "Error", description: `Failed to load user data: ${e.message}` });
    } finally {
      setIsLoadingUser(false);
    }
  }, [uid, toast]);

  useEffect(() => {
    // Ensure only admins can access this page, or redirect
    if (!performingUserIsAdmin && performingUser) {
        toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to view this page."});
        router.push("/dashboard");
        return;
    }
    loadUserData();
  }, [uid, performingUserIsAdmin, performingUser, router, toast, loadUserData]);


  const handleSaveChanges = async () => {
    if (!targetUser || !performingUserIsAdmin) {
        toast({ variant: "destructive", title: "Error", description: "Cannot save changes. Insufficient permissions or user data missing." });
        return;
    }
     if (performingUser?.role === "Editor" && (targetUser.role === "Administrator" || targetUser.role === "Editor") && editableRole !== targetUser.role) {
        toast({ variant: "destructive", title: "Action Not Allowed", description: "Editors cannot change the role of Administrator or other Editor accounts." });
        return;
    }
    if (performingUser?.role === "Editor" && editableRole === "Administrator") {
        toast({ variant: "destructive", title: "Action Not Allowed", description: "Editors cannot assign the Administrator role." });
        return;
    }


    setIsSaving(true);
    try {
      const userDocRef = doc(db, "users", targetUser.uid);
      const updates: Partial<User> = {
        name: editableName,
        role: editableRole,
        status: editableStatus,
      };
      await updateDoc(userDocRef, updates);
      // Update local state to reflect changes immediately
      setTargetUser(prev => prev ? { ...prev, ...updates } : null);
      toast({ title: "User Updated", description: `${editableName}'s profile has been successfully updated.` });
    } catch (e: any) {
      console.error("Error saving user changes:", e);
      toast({ variant: "destructive", title: "Update Failed", description: `Could not save changes: ${e.message}` });
    } finally {
      setIsSaving(false);
    }
  };
  
  const getInitial = (name?: string) => (name ? name.charAt(0).toUpperCase() : "U");

  if (isLoadingUser) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-64" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-5 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center">
         <Button variant="outline" onClick={() => router.push("/dashboard/admin/users")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to User List
        </Button>
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center justify-center text-destructive">
                    <AlertTriangle className="mr-2 h-6 w-6"/> Error
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>{error}</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!targetUser) {
    return <div className="container mx-auto py-8">User not found or you do not have permission.</div>;
  }
  
  const avatarSrc = targetUser.avatarUrl || `https://placehold.co/150x150.png?text=${getInitial(targetUser.name)}`;
  const isTargetUserAdminOrEditor = targetUser.role === "Administrator" || targetUser.role === "Editor";
  const canPerformingUserEditRole = performingUserIsAdmin || (performingUser?.role === "Editor" && !isTargetUserAdminOrEditor);
  const filteredRolesForEditor = availableRoles.filter(role => role.name !== "Administrator");


  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push("/dashboard/admin/users")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to User List
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
            <Card className="shadow-lg">
                 <CardHeader className="items-center text-center bg-muted/20 pb-6">
                    <Avatar className="h-24 w-24 border-2 border-primary mb-3">
                        <AvatarImage src={avatarSrc} alt={targetUser.name} data-ai-hint="profile person" />
                        <AvatarFallback className="text-3xl">{getInitial(targetUser.name)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-2xl">{targetUser.name}</CardTitle>
                    <CardDescription>{targetUser.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                <div>
                    <Label htmlFor="userName">Name</Label>
                    <Input id="userName" value={editableName} onChange={(e) => setEditableName(e.target.value)} disabled={isSaving || !performingUserIsAdmin} />
                     {!performingUserIsAdmin && <p className="text-xs text-muted-foreground mt-1">Only Administrators can change names.</p>}
                </div>
                <div>
                    <Label htmlFor="userEmail">Email</Label>
                    <Input id="userEmail" value={targetUser.email} readOnly disabled />
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed from this panel.</p>
                </div>
                <div>
                    <Label htmlFor="userRole">Role</Label>
                    <Select value={editableRole} onValueChange={setEditableRole} disabled={isSaving || !canPerformingUserEditRole}>
                    <SelectTrigger id="userRole">
                        <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                        {(performingUser?.role === "Editor" ? filteredRolesForEditor : availableRoles).map((role) => (
                        <SelectItem key={role.id || role.name} value={role.name}>
                            {role.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    {!canPerformingUserEditRole && <p className="text-xs text-muted-foreground mt-1">You do not have permission to change this user's role.</p>}
                </div>
                <div>
                    <Label htmlFor="userStatus">Status</Label>
                    <Select value={editableStatus} onValueChange={(value) => setEditableStatus(value as User["status"])} disabled={isSaving || !performingUserIsAdmin}>
                    <SelectTrigger id="userStatus">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                    </Select>
                     {!performingUserIsAdmin && <p className="text-xs text-muted-foreground mt-1">Only Administrators can change status.</p>}
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Member Since: {targetUser.createdAt ? new Date(targetUser.createdAt as string).toLocaleDateString() : 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Last Login: {targetUser.lastLogin ? new Date(targetUser.lastLogin as string).toLocaleString() : 'N/A'}</p>
                </div>
                </CardContent>
                <CardFooter>
                <Button onClick={handleSaveChanges} disabled={isSaving || !performingUserIsAdmin} className="w-full">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
                </CardFooter>
            </Card>
        </div>

        <div className="lg:col-span-2">
          {/* Pass the targetUser to UserServiceToggleList. It needs to be adapted to update a specific user. */}
          {/* For this, UserServiceToggleList's internal logic for updating Firestore would need to target `targetUser.uid` */}
          <UserServiceToggleList user={targetUser} />
        </div>
      </div>
    </div>
  );
}

