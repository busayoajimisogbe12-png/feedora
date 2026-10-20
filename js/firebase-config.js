import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


// Replace these example values with your own Firebase config.
const firebaseConfig = {
        apiKey: "AIzaSyDDBXNI7giizXwJJMbl6lE4EC-f3o60fXw",
        authDomain: "feedora-29e03.firebaseapp.com",
        projectId: "feedora-29e03",
        storageBucket: "feedora-29e03.firebasestorage.app",
        messagingSenderId: "138882478070",
        appId: "1:138882478070:web:2aa599144a8743ae2ea1d7"
};

// Connect Feedora to your Firebase project.
const app = initializeApp(firebaseConfig);

// Prepare Firebase Authentication.
export const auth = getAuth(app);
export const db = getFirestore(app);
