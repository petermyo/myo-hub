
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User, Service } from '@/types';

// Helper to validate service URL
async function isValidServiceUrl(urlToValidate: string): Promise<boolean> {
  if (!urlToValidate) return false;
  try {
    const servicesCol = collection(db, "services");
    const q = query(servicesCol, where("isActive", "==", true));
    const serviceSnapshot = await getDocs(q);
    const serviceList = serviceSnapshot.docs.map(docSnap => docSnap.data() as Service);
    
    const parsedUrlToValidate = new URL(urlToValidate);
    const domainToValidate = parsedUrlToValidate.hostname;

    return serviceList.some(service => {
        try {
            const serviceDomain = service.url.includes('://') ? new URL(service.url).hostname : service.url;
            return serviceDomain === domainToValidate;
        } catch (e) {
            console.warn(`Invalid URL format for service ${service.slug}: ${service.url}`);
            return false;
        }
    });
  } catch (error) {
    console.error("Error fetching or validating service URLs:", error);
    return false; // Fail safe
  }
}

const OZARNIA_HUB_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://hub.myozarniaung.com'; // Fallback

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, serviceRedirectUrl } = await request.json();

    if (!name || !email || !password || !serviceRedirectUrl) {
      return NextResponse.json({ success: false, error: "Missing required fields (name, email, password, serviceRedirectUrl).", redirectTo: OZARNIA_HUB_URL }, { status: 400, headers: corsHeaders });
    }
    if (password.length < 6) {
        return NextResponse.json({ success: false, error: "Password must be at least 6 characters.", redirectTo: OZARNIA_HUB_URL }, { status: 400, headers: corsHeaders });
    }

    const isValidRedirect = await isValidServiceUrl(serviceRedirectUrl);
    if (!isValidRedirect) {
      return NextResponse.json({ success: false, error: "Invalid or inactive service redirect URL.", redirectTo: OZARNIA_HUB_URL }, { status: 400, headers: corsHeaders });
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update Firebase Auth profile
    await updateProfile(firebaseUser, { displayName: name });

    // Create user document in Firestore
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const newUserDoc: Omit<User, 'password' | 'confirmPassword' | 'lastLogin' | 'subscriptionPlanId'> = {
      uid: firebaseUser.uid,
      name: name,
      email: email,
      role: "User", // Default role
      status: "active",
      createdAt: new Date().toISOString(),
      enabledServices: [], // Default: no services enabled initially
      avatarUrl: `https://placehold.co/100x100.png?text=${name.charAt(0).toUpperCase()}`,
    };
    await setDoc(userDocRef, newUserDoc);

    return NextResponse.json({ 
      success: true, 
      message: "User registered successfully. Please proceed with login.",
      redirectTo: serviceRedirectUrl 
    }, { status: 201, headers: corsHeaders });

  } catch (error: any) {
    console.error("External registration error:", error);
    let errorMessage = "An unknown error occurred during registration.";
    let statusCode = 500;

    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "This email address is already in use.";
          statusCode = 409; // Conflict
          break;
        case 'auth/weak-password':
          errorMessage = "The password is too weak. Please choose a stronger password (at least 6 characters).";
          statusCode = 400;
          break;
        case 'auth/invalid-email':
          errorMessage = "The email address is not valid.";
          statusCode = 400;
          break;
        default:
          errorMessage = error.message || `A Firebase error occurred: ${error.code}`;
          break;
      }
    }
    return NextResponse.json({ success: false, error: errorMessage, redirectTo: OZARNIA_HUB_URL }, { status: statusCode, headers: corsHeaders });
  }
}
