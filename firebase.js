import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";

// 🔐 Firebase Config (Project: lay01-a0522)
const firebaseConfig = {
  apiKey: "AIzaSyBIpu7d1kC_sjKAp9yhA11_fr9HVGXkEJk",
  authDomain: "lay01-a0522.firebaseapp.com",
  databaseURL: "https://lay01-a0522-default-rtdb.firebaseio.com",
  projectId: "lay01-a0522",
  storageBucket: "lay01-a0522.appspot.com", // ❗️ตรงนี้แก้จาก .app เป็น .app**spot.com**
  messagingSenderId: "22588227396",
  appId: "1:22588227396:web:401bc67445565eee67a111",
  measurementId: "G-ND7FX0KBJ9"
};

// 🚀 Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔐 Auth & Google Provider
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider(); // ✅ เพิ่มบรรทัดนี้

// 📦 Database & Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

// 📊 Analytics
export const analytics = getAnalytics(app);

// 📤 Export ทั้งหมด
export { app };
