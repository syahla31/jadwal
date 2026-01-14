// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDRZ0VcQOpFIQ5upbX7qsCz9qHGaNZ5er4",
  authDomain: "jadwaljaminanmutu.firebaseapp.com",
  projectId: "jadwaljaminanmutu",
  storageBucket: "jadwaljaminanmutu.firebasestorage.app",
  messagingSenderId: "251445189196",
  appId: "1:251445189196:web:8e8e132ad9c80e053cb2e9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // Kita export 'db' biar bisa dipanggil di file lain