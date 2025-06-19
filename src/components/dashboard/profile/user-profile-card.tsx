"use client";

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserCircle, Mail, Edit3, Save, Loader2 } from "lucide-react";
import type { User } from '@/types';

// Dummy user data - replace with actual data fetching
const dummyUser: User = {
  id: "user123",
  name: "Demo User",
  email: "demo@example.com",
  role: "User",
  status: "active",
  createdAt: new Date().toISOString(),
  avatarUrl: "https://placehold.co/150x150.png",
  enabledServices: ["content-service", "shortener-service"],
};

export function UserProfileCard() {
  const [user, setUser] = useState<User>(dummyUser);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value } as User));
  };

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Updated user profile:", user);
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved.",
    });
    setIsEditing(false);
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-2xl shadow-lg rounded-xl">
      <CardHeader className="flex flex-row items-center gap-4 p-6 bg-muted/30">
        <Avatar className="h-20 w-20 border-2 border-primary">
          <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="profile person" />
          <AvatarFallback className="text-2xl">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
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
          <p className="text-lg font-medium mt-1">{new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </CardContent>
      <CardFooter className="p-6 border-t">
        {isEditing ? (
          <div className="flex gap-2 w-full">
            <Button onClick={handleSave} className="flex-1" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => { setIsEditing(false); setUser(dummyUser); }} className="flex-1">
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
