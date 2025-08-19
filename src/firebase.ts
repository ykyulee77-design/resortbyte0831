// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const getFirebaseConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    // 프로덕션 환경에서는 환경변수 사용
    const requiredEnvVars = [
      'REACT_APP_FIREBASE_API_KEY',
      'REACT_APP_FIREBASE_AUTH_DOMAIN',
      'REACT_APP_FIREBASE_PROJECT_ID',
      'REACT_APP_FIREBASE_STORAGE_BUCKET',
      'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
      'REACT_APP_FIREBASE_APP_ID'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error('Missing required Firebase environment variables:', missingVars);
      throw new Error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
    }

    return {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID,
      measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
    };
  } else {
    // 개발 환경용 설정
    return {
      apiKey: "AIzaSyDMbwRLPGOyilZqWC0wQBE5AaUetES4NG0",
      authDomain: "resortbyte.firebaseapp.com",
      projectId: "resortbyte",
      storageBucket: "resortbyte.firebasestorage.app",
      messagingSenderId: "267339322445",
      appId: "1:267339322445:web:ba25d81a94b33252c47804",
      measurementId: "G-3GG8DMZTW3"
    };
  }
};

// Initialize Firebase
const app = initializeApp(getFirebaseConfig());

// Firebase 서비스 내보내기
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;