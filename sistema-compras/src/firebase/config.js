// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD0N0QMPdyXxSqQCPVEQzlihG2j9I3gHN8",
  authDomain: "comprasnatville.firebaseapp.com",
  projectId: "comprasnatville",
  storageBucket: "comprasnatville.firebasestorage.app",
  messagingSenderId: "687041565489",
  appId: "1:687041565489:web:8a02f9b858a73426771610",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
