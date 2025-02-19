// src/firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
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
const auth = getAuth(app);

// 設置身份驗證持久性為 LOCAL，這樣登入狀態會保存在 localStorage 中
setPersistence(auth, browserLocalPersistence);

export { db, auth };
export default app;
