// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDMbwRLPGOyilZqWC0wQBE5AaUetES4NG0",
  authDomain: "resortbyte.firebaseapp.com",
  projectId: "resortbyte",
  storageBucket: "resortbyte.appspot.com",
  messagingSenderId: "267339322445",
  appId: "1:267339322445:web:ba25d81a94b33252c47804",
  measurementId: "G-3GG8DMZTW3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase 서비스 내보내기
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;