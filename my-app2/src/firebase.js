import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API,
    authDomain: "booking2-0.firebaseapp.com",
    projectId: "booking2-0",
    storageBucket: "booking2-0.firebasestorage.app",
    messagingSenderId: "488200677453",
    appId: "1:488200677453:web:ce3fdf95a8d63baf5ad404",
    measurementId: "G-M0L8CGM21T"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);