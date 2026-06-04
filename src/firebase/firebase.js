import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
// 1. Import the Firestore service layer
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAHyjYc4NW8nVhhXpx3v33yNN4194wqau4",
  authDomain: "resumeai-1028c.firebaseapp.com",
  projectId: "resumeai-1028c",
  storageBucket: "resumeai-1028c.firebasestorage.app",
  messagingSenderId: "443172589197",
  appId: "1:443172589197:web:8c0600380a395250b5dcc4"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// 2. Initialize and export your services cleanly
export const auth = getAuth(app)
export const db = getFirestore(app) // <-- Firestore database node is now live!