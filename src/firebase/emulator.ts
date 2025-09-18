import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectAuthEmulator } from 'firebase/auth';
import { db, auth } from '../firebase';

// 에뮬레이터 연결 함수
export const connectEmulators = () => {
  const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
  
  if (!isDevelopment) {
    return;
  }

  // 에뮬레이터 연결 시도 (실패해도 앱은 정상 작동)
  const connectEmulatorsSafely = async () => {
    try {
      // Firestore 에뮬레이터 연결
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('✅ Firestore 에뮬레이터 연결됨: localhost:8080');
      } catch (error) {
        console.log('ℹ️ Firestore 에뮬레이터 연결 실패 (정상 작동)');
      }

      // Auth 에뮬레이터 연결
      try {
        connectAuthEmulator(auth, 'http://localhost:9099');
        console.log('✅ Auth 에뮬레이터 연결됨: localhost:9099');
      } catch (error) {
        console.log('ℹ️ Auth 에뮬레이터 연결 실패 (정상 작동)');
      }
    } catch (error) {
      console.log('ℹ️ 에뮬레이터 연결 시도 완료 (정상 작동)');
    }
  };

  // 비동기로 에뮬레이터 연결 시도
  connectEmulatorsSafely();
};
