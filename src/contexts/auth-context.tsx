
"use client";

import type { User as FirebaseUserType } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import type { ReactNode} from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import type { User } from "@/types";

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true); // Set loading true at the start of auth state processing
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userDocRef = doc(db, "users", fbUser.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const appUser = { uid: fbUser.uid, ...userDocSnap.data() } as User;
            setCurrentUser(appUser);
            setIsAdmin(appUser.role === "Administrator");
            await updateDoc(userDocRef, { // Ensure this is awaited
              lastLogin: new Date().toISOString()
            });
          } else {
            console.warn("User document not found in Firestore for UID:", fbUser.uid, "Creating one.");
            const newUserProfile: User = {
              uid: fbUser.uid,
              name: fbUser.displayName || "User",
              email: fbUser.email || "unknown@example.com",
              role: "User",
              status: "active",
              createdAt: new Date().toISOString(),
              avatarUrl: fbUser.photoURL || `https://placehold.co/100x100.png?text=${(fbUser.displayName || "U").charAt(0)}`,
              enabledServices: [],
              lastLogin: new Date().toISOString(),
            };
            await setDoc(userDocRef, newUserProfile); // Ensure this is awaited
            setCurrentUser(newUserProfile);
            setIsAdmin(newUserProfile.role === "Administrator");
          }
        } catch (error) {
            console.error("Error fetching or updating user document:", error);
            const basicUser: User = {
                uid: fbUser.uid,
                email: fbUser.email || "unknown@example.com",
                name: fbUser.displayName || "User",
                role: "User",
                status: "active",
                createdAt: new Date().toISOString(),
                enabledServices: [],
                avatarUrl: `https://placehold.co/100x100.png?text=${(fbUser.displayName || "U").charAt(0)}`
            };
            setCurrentUser(basicUser);
            setIsAdmin(false);
        } finally {
          setLoading(false); // Set loading to false only after all async operations for a logged-in user are done
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setLoading(false); // Set loading to false if no user
      }
    });

    return () => unsubscribe();
  }, []);

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
