
"use client";

import type { User as FirebaseUserType } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, DocumentData } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import type { ReactNode} from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import type { User } from "@/types"; // Your app's User type

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
  // router and pathname are not directly needed by AuthProvider for its own rendering logic anymore

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const appUser = { uid: user.uid, ...userDocSnap.data() } as User;
          setCurrentUser(appUser);
          setIsAdmin(appUser.role === "Administrator");
        } else {
          console.warn("User document not found in Firestore for UID:", user.uid);
          // Create a default user profile if none exists, ensuring all User fields are met
          const defaultUser: User = { 
            uid: user.uid,
            email: user.email || "",
            name: user.displayName || "User",
            role: "User", 
            status: "active",
            createdAt: new Date().toISOString(),
            enabledServices: [],
            avatarUrl: `https://placehold.co/100x100.png?text=${(user.displayName || "U").charAt(0)}`
          };
          setCurrentUser(defaultUser);
          setIsAdmin(false);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // AuthContext.Provider must always wrap children.
  // Consuming components will use the `loading` state from the context
  // to determine their own rendering (e.g., show a spinner or skeleton).
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
