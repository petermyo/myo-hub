
"use client";

import { useState, useEffect, ChangeEvent } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserCircle, Mail, Edit3, Save, Loader2 } from "lucide-react";
import type { User } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton"; // Added import

export function UserProfileCard() {
  const { currentUser: authUser, loading: authLoading, firebaseUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For save operation
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (authUser && authUser.uid) {
      const fetchUserProfile = async () => {
        setIsFetchingProfile(true);
        const userDocRef = doc(db, "users", authUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUser({ uid: docSnap.id, ...docSnap.data() } as User);
        } else {
          // If Firestore doc doesn't exist, create one from authUser basic info
           const newUserProfile: User = {
            uid: authUser.uid,
            name: firebaseUser?.displayName || authUser.name || "User",
            email: firebaseUser?.email || authUser.email,
            role: authUser.role || "User",
            status: authUser.status || "active",
            createdAt: authUser.createdAt || new Date().toISOString(),
            avatarUrl: firebaseUser?.photoURL || authUser.avatarUrl || `https://placehold.co/150x150.png?text=${(firebaseUser?.displayName || authUser.name || "U").charAt(0)}`,
            enabledServices: authUser.enabledServices || [],
          };
          await setDoc(userDocRef, newUserProfile);
          setUser(newUserProfile);
          console.warn("User profile not found in Firestore, created one.");
        }
        setIsFetchingProfile(false);
      };
      fetchUserProfile();
    } else if (!authLoading) {
        setIsFetchingProfile(false); // Not authenticated or auth still loading
    }
  }, [authUser, authLoading, firebaseUser]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const { name, value } = e.target;
    setUser(prev => ({ ...prev!, [name]: value } as User));
  };

  const handleSave = async () => {
    if (!user || !user.uid) return;
    setIsLoading(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      const { uid, role, status, createdAt, password, confirmPassword, ...dataToUpdate } = user; // Exclude fields not directly editable here
      await updateDoc(userDocRef, dataToUpdate);
      
      // Note: Updating email in Firebase Auth requires re-authentication or specific functions,
      // and updating displayName in Auth is separate. Here we only update Firestore.
      // If firebaseUser exists and name was changed, consider updating auth profile:
      // if (firebaseUser && firebaseUser.displayName !== dataToUpdate.name) {
      //   await updateProfile(firebaseUser, { displayName: dataToUpdate.name });
      // }

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not save your profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getInitial = (name?: string) => (name ? name.charAt(0).toUpperCase() : "U");

  if (authLoading || isFetchingProfile) {
    return (
      <Card className="w-full max-w-2xl shadow-lg rounded-xl">
        <CardHeader className="flex flex-row items-center gap-4 p-6 bg-muted/30">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-72" />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-8 w-1/2" />
        </CardContent>
        <CardFooter className="p-6 border-t">
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  if (!user) {
    return <Card className="w-full max-w-2xl p-6"><CardTitle>No user profile found.</CardTitle></Card>;
  }
  
  const avatarSrc = user.avatarUrl || `https://placehold.co/150x150.png?text=${getInitial(user.name)}`;

  return (
    <Card className="w-full max-w-2xl shadow-lg rounded-xl">
      <CardHeader className="flex flex-row items-center gap-4 p-6 bg-muted/30">
        <Avatar className="h-20 w-20 border-2 border-primary">
          <AvatarImage src={avatarSrc} alt={user.name} data-ai-hint="profile person" />
          <AvatarFallback className="text-2xl">{getInitial(user.name)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-3xl font-headline">{isEditing ? "Edit Profile" : user.name}</CardTitle>
          <CardDescription className="text-md">Manage your personal information and account settings.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name" className="flex items-center text-sm font-medium text-muted-foreground">
              <UserCircle className="w-4 h-4 mr-2" /> Full Name
            </Label>
            {isEditing ? (
              <Input id="name" name="name" value={user.name} onChange={handleInputChange} className="mt-1" />
            ) : (
              <p className="text-lg font-medium mt-1">{user.name}</p>
            )}
          </div>
          <div>
            <Label htmlFor="email" className="flex items-center text-sm font-medium text-muted-foreground">
              <Mail className="w-4 h-4 mr-2" /> Email Address
            </Label>
            {isEditing ? (
              <Input id="email" name="email" type="email" value={user.email} onChange={handleInputChange} className="mt-1" />
            ) : (
              <p className="text-lg font-medium mt-1">{user.email}</p>
            )}
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Role</Label>
          <p className="text-lg font-medium mt-1">{user.role}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Account Status</Label>
          <p className={`text-lg font-medium mt-1 capitalize ${user.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
            {user.status}
          </p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
          <p className="text-lg font-medium mt-1">{user.createdAt ? new Date(user.createdAt as string).toLocaleDateString() : 'N/A'}</p>
        </div>
      </CardContent>
      <CardFooter className="p-6 border-t">
        {isEditing ? (
          <div className="flex gap-2 w-full">
            <Button onClick={handleSave} className="flex-1" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => { setIsEditing(false); /* Re-fetch or reset if needed */ }} className="flex-1" disabled={isLoading}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)} className="w-full">
            <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
