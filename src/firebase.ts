import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDA-pAUs4pvVBgHdrMbZcFBvbwS0g1M8bA",
  authDomain: "macrown-13e95.firebaseapp.com",
  projectId: "macrown-13e95",
  storageBucket: "macrown-13e95.firebasestorage.app",
  messagingSenderId: "774297780624",
  appId: "1:774297780624:web:6b9f6ecba88460c77ff315",
  measurementId: "G-537FFR0LZY",
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore (Database)
export const db = getFirestore(app);

// Initialize Firebase Analytics safely (checks browser support e.g. IndexedDB / environment)
export let analytics: ReturnType<typeof getAnalytics> | null = null;

if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics not supported in this environment
    });
}
