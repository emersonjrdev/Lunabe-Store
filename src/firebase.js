// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD97tce6QWPejKZ1_ohhPfrye9_sBQEyI8",
  authDomain: "lunabestore-7ae87.firebaseapp.com",
  projectId: "lunabestore-7ae87",
  storageBucket: "lunabestore-7ae87.firebasestorage.app",
  messagingSenderId: "77616402855",
  appId: "1:77616402855:web:e78ccf0e6bc33351f7e682"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);


// 🔥 Novo:
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
