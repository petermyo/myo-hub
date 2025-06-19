
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// ================================================================================================
// IMPORTANT: FIREBASE CONFIGURATION INSTRUCTIONS
// ================================================================================================
// The `firebaseConfig` object below contains PLACEHOLDER values.
// You MUST replace these with the actual configuration values for YOUR Firebase project.
//
// To get your Firebase project's configuration:
// 1. Go to the Firebase console (https://console.firebase.google.com/).
// 2. Select your Firebase project (or create one if you haven't).
// 3. In the project overview, click on the "Web" icon (</>) to add a web app or select an existing one.
//    - If you're adding a new web app:
//      - Register your app (give it a nickname).
//      - Firebase Hosting setup is optional for now.
//      - After registration, Firebase will display the `firebaseConfig` object. Copy these values.
//    - If you have an existing web app:
//      - Go to "Project settings" (click the gear icon ⚙️ next to "Project Overview").
//      - Scroll down to the "Your apps" section.
//      - Find your web app and look for "SDK setup and configuration".
//      - Select "Config" to view the `firebaseConfig` object. Copy these values.
//
// Replace the placeholder values in the `firebaseConfig` object below with the ones you copied.
// For example:
//   apiKey: "AIzaSyB...",
//   authDomain: "your-project-id.firebaseapp.com",
//   projectId: "your-project-id",
//   ...etc.
//
// ENSURE THIS IS DONE BEFORE DEPLOYING YOUR APPLICATION.
// ================================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBrnFpY_dJE6Yb4BfVoOCDxeaaAhuPFRLg", // REPLACE WITH YOUR ACTUAL API KEY
  authDomain: "ozarnia-hub.firebaseapp.com", // REPLACE WITH YOUR ACTUAL AUTH DOMAIN
  projectId: "ozarnia-hub", // REPLACE WITH YOUR ACTUAL PROJECT ID
  storageBucket: "ozarnia-hub.firebasestorage.app", // REPLACE WITH YOUR ACTUAL STORAGE BUCKET
  messagingSenderId: "220239551651", // REPLACE WITH YOUR ACTUAL MESSAGING SENDER ID
  appId: "1:220239551651:web:bf0f0ea29d1181bb40f316" // REPLACE WITH YOUR ACTUAL APP ID
  // measurementId: "G-XXXXXXXXXX" // Optional: REPLACE WITH YOUR ACTUAL MEASUREMENT ID
};


// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
