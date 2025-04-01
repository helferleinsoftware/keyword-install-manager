// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyB5E2twz5RG9wt2NrZEhH7Rc1yK57eexn0",
    authDomain: "keyword-install-manager.firebaseapp.com",
    projectId: "keyword-install-manager",
    storageBucket: "keyword-install-manager.firebasestorage.app",
    messagingSenderId: "701699319719",
    appId: "1:701699319719:web:4503ca00fcaf32c1d0b882"
  };

// Firebase App initialisieren
const app = initializeApp(firebaseConfig);

// Firebase Services exportieren für die Verwendung in anderen Teilen der App
export const db = getFirestore(app); // Firestore Datenbank Instanz
export const auth = getAuth(app);    // Firebase Auth Instanz

export default app; // Exportiere ggf. auch die App-Instanz selbst