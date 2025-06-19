
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import type { User } from "@/types";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName: values.name });

      const userDocRef = doc(db, "users", firebaseUser.uid);
      const newUserDoc: Omit<User, 'password' | 'confirmPassword' | 'lastLogin' | 'subscriptionPlanId'> = {
        uid: firebaseUser.uid,
        name: values.name,
        email: values.email,
        role: "User", 
        status: "active",
        createdAt: new Date().toISOString(),
        enabledServices: [], 
        avatarUrl: `https://placehold.co/100x100.png?text=${values.name.charAt(0).toUpperCase()}`,
      };
      await setDoc(userDocRef, newUserDoc);

      toast({
        title: "Registration Successful!",
        description: "Your account has been created. Redirecting to login...",
      });
      router.push("/auth/login");

    } catch (error: any) {
      console.error("Firebase registration error details:", error); 

      let errorMessage = "An error occurred during registration. Please try again.";

      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message?: string };
        switch (firebaseError.code) {
          case 'auth/email-already-in-use':
            errorMessage = "This email address is already in use. Please try a different email or log in.";
            break;
          case 'auth/weak-password':
            errorMessage = "The password is too weak. Please choose a stronger password (at least 6 characters).";
            break;
          case 'auth/invalid-email':
            errorMessage = "The email address is not valid. Please check and try again.";
            break;
          default:
            // Use Firebase's message if available, otherwise keep the generic one
            errorMessage = firebaseError.message || `A Firebase error occurred: ${firebaseError.code}`;
            break;
        }
      } else if (error instanceof Error && typeof error.message === 'string' && error.message) {
        // Handle standard JavaScript errors that have a message property
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl rounded-lg">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center">Create an Account</CardTitle>
        <CardDescription className="text-center">
          Join Ozarnia Hub to manage your services with ease.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Sign Up
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Separator />
        <div className="text-sm text-muted-foreground text-center">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

const Separator = () => <hr className="border-border" />;
