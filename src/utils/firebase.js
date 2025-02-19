// src/firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1tMzYnm9ylkKK8MpkWQ2gK3hv6DtZYpE",
  authDomain: "social-cool-f0ffe.firebaseapp.com",
  projectId: "social-cool-f0ffe",
  storageBucket: "social-cool-f0ffe.firebasestorage.app",
  messagingSenderId: "210950654497",
  appId: "1:210950654497:web:0f23d4bd64ac9f505a7160"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
export default app;
