// firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";

import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // <-- IMPORTAR STORAGE

const firebaseConfig = {
  apiKey: "AIzaSyD97tce6QWPejKZ1_ohhPfrye9_sBQEyI8",
  authDomain: "lunabestore-7ae87.firebaseapp.com",
  projectId: "lunabestore-7ae87",
  storageBucket: "lunabestore-7ae87.appspot.com",
  messagingSenderId: "77616402855",
  appId: "1:77616402855:web:e78ccf0e6bc33351f7e682"
};

const app = initializeApp(firebaseConfig);

// 🔥 AUTH
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 🔥 FIRESTORE
export const db = getFirestore(app);

// 🔥 STORAGE (AGORA FUNCIONA)
export const storage = getStorage(app);

/**
 * LOGIN UNIVERSAL
 */
export const loginGoogle = () => {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    return signInWithRedirect(auth, googleProvider);
  } else {
    return signInWithPopup(auth, googleProvider);
  }
};

/**
 * LOGIN VIA REDIRECT
 */
export const checkRedirectLogin = async () => {
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch (err) {
    console.error("Erro ao recuperar login:", err);
    return null;
  }
};
