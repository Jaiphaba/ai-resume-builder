import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAHyjYc4NW8nVhhXpx3v33yNN4194wqau4",
  authDomain: "resumeai-1028c.firebaseapp.com",
  projectId: "resumeai-1028c",
  storageBucket: "resumeai-1028c.firebasestorage.app",
  messagingSenderId: "443172589197",
  appId: "1:443172589197:web:8c0600380a395250b5dcc4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Authentication Provider
export const googleProvider = new GoogleAuthProvider();