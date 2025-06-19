
"use client";

import type { User as FirebaseUserType } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, DocumentData } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import type { ReactNode} from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import type { User } from "@/types"; // Your app's User type
import { Skeleton } from "@/components/ui/skeleton";


interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUserType | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const appUser = { uid: user.uid, ...userDocSnap.data() } as User;
          setCurrentUser(appUser);
          setIsAdmin(appUser.role === "Administrator");
        } else {
          // This case should ideally not happen if user data is created on registration
          console.warn("User document not found in Firestore for UID:", user.uid);
          // Fallback: create a minimal user object or sign out
          setCurrentUser({
            uid: user.uid,
            email: user.email || "",
            name: user.displayName || "User",
            role: "User", // default role
            status: "active",
            createdAt: new Date().toISOString(),
          });
          setIsAdmin(false);
        }
      } else {
        // User is signed out
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Handle route protection while loading
  if (loading && (pathname.startsWith('/dashboard') || pathname.startsWith('/auth'))) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
             <Skeleton className="h-20 w-full max-w-md mb-4" />
             <Skeleton className="h-10 w-full max-w-md mb-2" />
             <Skeleton className="h-10 w-full max-w-md mb-6" />
             <Skeleton className="h-10 w-full max-w-md" />
        </div>
    );
  }


  return (
    <AuthContext.Provider value={{ currentUser, firebaseUser, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
