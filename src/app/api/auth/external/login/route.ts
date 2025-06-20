
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Service } from '@/types';

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
    return false;
  }
}

const OZARNIA_HUB_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://hub.myozarniaung.com'; 

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
    const { email, password, serviceRedirectUrl } = await request.json();

    if (!email || !password || !serviceRedirectUrl) {
      return NextResponse.json({ success: false, error: "Missing required fields (email, password, serviceRedirectUrl).", redirectTo: OZARNIA_HUB_URL }, { status: 400, headers: corsHeaders });
    }

    const isValidRedirect = await isValidServiceUrl(serviceRedirectUrl);
    if (!isValidRedirect) {
      return NextResponse.json({ success: false, error: "Invalid or inactive service redirect URL.", redirectTo: OZARNIA_HUB_URL }, { status: 400, headers: corsHeaders });
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const userDocRef = doc(db, "users", firebaseUser.uid);
    await updateDoc(userDocRef, {
      lastLogin: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      message: "Login successful.",
      redirectTo: serviceRedirectUrl 
    }, { status: 200, headers: corsHeaders });

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
          statusCode = 401; 
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
    return NextResponse.json({ success: false, error: errorMessage, redirectTo: OZARNIA_HUB_URL }, { status: statusCode, headers: corsHeaders });
  }
}
