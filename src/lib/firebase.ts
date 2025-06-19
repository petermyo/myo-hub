
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// ================================================================================================
// IMPORTANT: REPLACE THE PLACEHOLDER VALUES BELOW WITH YOUR ACTUAL FIREBASE PROJECT CONFIGURATION!
// You can find these details in your Firebase project settings.
// ================================================================================================
// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY", // Replace with your Firebase project's API Key
//   authDomain: "YOUR_AUTH_DOMAIN", // Replace with your Firebase project's Auth Domain
//   projectId: "YOUR_PROJECT_ID", // Replace with your Firebase project's Project ID
//   storageBucket: "YOUR_STORAGE_BUCKET", // Replace with your Firebase project's Storage Bucket
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your Firebase project's Messaging Sender ID
//   appId: "YOUR_APP_ID", // Replace with your Firebase project's App ID
//   measurementId: "YOUR_MEASUREMENT_ID" // Optional: Replace with your Firebase project's Measurement ID
// };
const firebaseConfig = {
  apiKey: "AIzaSyBrnFpY_dJE6Yb4BfVoOCDxeaaAhuPFRLg",
  authDomain: "ozarnia-hub.firebaseapp.com",
  projectId: "ozarnia-hub",
  storageBucket: "ozarnia-hub.firebasestorage.app",
  messagingSenderId: "220239551651",
  appId: "1:220239551651:web:bf0f0ea29d1181bb40f316"
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

