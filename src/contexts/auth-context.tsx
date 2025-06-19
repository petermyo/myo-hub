
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
  isAdmin: boolean; // True if role is "Administrator"
  // Add other role checks if needed, e.g., isEditor
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userDocRef = doc(db, "users", fbUser.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          let appUser: User;
          if (userDocSnap.exists()) {
            appUser = { uid: fbUser.uid, ...userDocSnap.data() } as User;
            console.log("AuthContext: User role from Firestore:", appUser.role); // Log the fetched role
            // Update lastLogin if user document exists
            await updateDoc(userDocRef, {
              lastLogin: new Date().toISOString()
            });
            // Refresh appUser with updated lastLogin if needed, or assume it's reflected in subsequent reads
            appUser.lastLogin = new Date().toISOString();
          } else {
            console.warn("User document not found in Firestore for UID:", fbUser.uid, "Creating one.");
            const defaultRole = "User"; // New users default to "User" role
            const newUserProfile: User = {
              uid: fbUser.uid,
              name: fbUser.displayName || "New User",
              email: fbUser.email || "unknown@example.com",
              role: defaultRole,
              status: "active",
              createdAt: new Date().toISOString(),
              avatarUrl: fbUser.photoURL || `https://placehold.co/100x100.png?text=${(fbUser.displayName || "U").charAt(0)}`,
              enabledServices: [],
              lastLogin: new Date().toISOString(),
            };
            await setDoc(userDocRef, newUserProfile);
            appUser = newUserProfile;
            console.log("AuthContext: Created new user profile with role:", appUser.role); // Log role for new user
          }
          setCurrentUser(appUser);
          
          let determinedIsAdmin = false;
          if (appUser && appUser.role) { 
              determinedIsAdmin = appUser.role.toLowerCase() === "administrator";
          }
          setIsAdmin(determinedIsAdmin);
          console.log("AuthContext: isAdmin determined as:", determinedIsAdmin);


        } catch (error) {
            console.error("Error fetching or updating user document:", error);
            // Fallback to basic user from Firebase Auth if Firestore interaction fails
            const basicUser: User = {
                uid: fbUser.uid,
                email: fbUser.email || "unknown@example.com",
                name: fbUser.displayName || "User",
                role: "User", // Default role on error
                status: "active",
                createdAt: new Date().toISOString(),
                enabledServices: [],
                avatarUrl: `https://placehold.co/100x100.png?text=${(fbUser.displayName || "U").charAt(0)}`
            };
            setCurrentUser(basicUser);
            setIsAdmin(false);
        } finally {
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setLoading(false);
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

