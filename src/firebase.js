// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSyDRZ0VcQOpFIQ5upbX7qsCz9qHGaNZ5er4",
  authDomain: "jadwaljaminanmutu.firebaseapp.com",
  projectId: "jadwaljaminanmutu",
  storageBucket: "jadwaljaminanmutu.firebasestorage.app",
  messagingSenderId: "251445189196",
  appId: "1:251445189196:web:8e8e132ad9c80e053cb2e9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export db dan auth agar bisa digunakan di file lain (App.js)
export const db = getFirestore(app);
export const auth = getAuth(app);