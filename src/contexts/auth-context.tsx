
"use client";

import type { User as FirebaseUserType } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"; // Added updateDoc
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const appUser = { uid: user.uid, ...userDocSnap.data() } as User;
            setCurrentUser(appUser);
            setIsAdmin(appUser.role === "Administrator");
            // Update lastLogin timestamp
            await updateDoc(userDocRef, {
              lastLogin: new Date().toISOString()
            });
          } else {
            console.warn("User document not found in Firestore for UID:", user.uid, "Creating one.");
            // If Firestore doc doesn't exist, create one from authUser basic info
            const newUserProfile: User = {
              uid: user.uid,
              name: user.displayName || "User",
              email: user.email || "unknown@example.com", // Ensure email is always set
              role: "User", // Default role
              status: "active",
              createdAt: new Date().toISOString(),
              avatarUrl: user.photoURL || `https://placehold.co/100x100.png?text=${(user.displayName || "U").charAt(0)}`,
              enabledServices: [],
              lastLogin: new Date().toISOString(), // Set lastLogin for new profile
            };
            await setDoc(userDocRef, newUserProfile);
            setCurrentUser(newUserProfile);
            setIsAdmin(newUserProfile.role === "Administrator");
          }
        } catch (error) {
            console.error("Error fetching or updating user document:", error);
            // Fallback: set a basic user object if Firestore interaction fails
            const basicUser: User = {
                uid: user.uid,
                email: user.email || "",
                name: user.displayName || "User",
                role: "User", // Default role, might not be accurate
                status: "active",
                createdAt: new Date().toISOString(), // Or from user.metadata.creationTime if available
                enabledServices: [],
                avatarUrl: `https://placehold.co/100x100.png?text=${(user.displayName || "U").charAt(0)}`
            };
            setCurrentUser(basicUser);
            setIsAdmin(false); // Cannot determine admin status without Firestore role
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
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

