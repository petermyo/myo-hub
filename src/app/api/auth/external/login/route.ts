
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Service } from '@/types';

// Helper to validate service URL (can be shared or defined per route)
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
    return false;
  }
}

const OZARNIA_HUB_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://hub.myozarniaung.com'; // Fallback

export async function POST(request: NextRequest) {
  try {
    const { email, password, serviceRedirectUrl } = await request.json();

    if (!email || !password || !serviceRedirectUrl) {
      return NextResponse.json({ success: false, error: "Missing required fields (email, password, serviceRedirectUrl).", redirectTo: OZARNIA_HUB_URL }, { status: 400 });
    }

    const isValidRedirect = await isValidServiceUrl(serviceRedirectUrl);
    if (!isValidRedirect) {
      return NextResponse.json({ success: false, error: "Invalid or inactive service redirect URL.", redirectTo: OZARNIA_HUB_URL }, { status: 400 });
    }

    // Sign in user with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update lastLogin in Firestore
    const userDocRef = doc(db, "users", firebaseUser.uid);
    await updateDoc(userDocRef, {
      lastLogin: new Date().toISOString()
    });

    // Note: Session management (e.g., setting a cookie or returning a token)
    // is not implemented here. The calling service would typically handle this
    // after a successful login response. Ozarnia Hub itself uses Firebase client-side auth state.

    return NextResponse.json({ 
      success: true, 
      message: "Login successful.",
      // In a real scenario, you might return a session token or user info.
      // For now, the validated redirect URL is sufficient for the third-party service to handle redirection.
      // userId: firebaseUser.uid, // Optionally return user ID
      redirectTo: serviceRedirectUrl // Send back the validated URL
    }, { status: 200 });

  } catch (error: any) {
    console.error("External login error:", error);
    let errorMessage = "An unknown error occurred during login.";
    let statusCode = 500;

    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = "Invalid email or password.";
          statusCode = 401; // Unauthorized
          break;
        case 'auth/too-many-requests':
            errorMessage = "Too many login attempts. Please try again later.";
            statusCode = 429;
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
    return NextResponse.json({ success: false, error: errorMessage, redirectTo: OZARNIA_HUB_URL }, { status: statusCode });
  }
}
