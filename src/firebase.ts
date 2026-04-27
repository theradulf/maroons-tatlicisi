// src/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// IMPORTANT: Replace these with your actual Firebase project configuration!
const firebaseConfig = {
  apiKey: "AIzaSyA4jZkKZR1Pxz5YPxILrcljkETj8eQyPOE",
  authDomain: "maroons-2e1e1.firebaseapp.com",
  projectId: "maroons-2e1e1",
  storageBucket: "maroons-2e1e1.firebasestorage.app",
  messagingSenderId: "726307465579",
  appId: "1:726307465579:web:f17a337c6d3e6745eb442e",
  measurementId: "G-NSJXSL13M7"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
