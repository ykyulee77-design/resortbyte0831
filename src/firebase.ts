// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const getFirebaseConfig = () => {
  // 모든 환경에서 동일한 설정 사용 (개발 환경 설정)
  return {
    apiKey: 'AIzaSyCHkBLwZJpy0x0Fwdi2VRTtjs-_k2AX-q0',
    authDomain: 'resortbyte-dev.firebaseapp.com',
    projectId: 'resortbyte-dev',
    storageBucket: 'resortbyte-dev.firebasestorage.app',
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

// 실제 Firebase 프로덕션 환경 사용
console.log('🔥 Firebase 실제 프로덕션 환경 연결:', {
  projectId: 'resortbyte-dev',
  authDomain: 'resortbyte-dev.firebaseapp.com'
});

export default app;