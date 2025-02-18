// src/firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
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
const firebase = initializeApp(firebaseConfig);

export default firebase;
