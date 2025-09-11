// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const getFirebaseConfig = () => {
  // 모든 환경에서 동일한 설정 사용 (개발 환경 설정)
  return {
    apiKey: 'AIzaSyDMbwRLPGOyilZqWC0wQBE5AaUetES4NG0',
    authDomain: 'resortbyte.firebaseapp.com',
    projectId: 'resortbyte',
    storageBucket: 'resortbyte.firebasestorage.app',
    messagingSenderId: '267339322445',
    appId: '1:267339322445:web:ba25d81a94b33252c47804',
    measurementId: 'G-3GG8DMZTW3',
  };
};

// Initialize Firebase
const app = initializeApp(getFirebaseConfig());

// Firebase 서비스 내보내기
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;