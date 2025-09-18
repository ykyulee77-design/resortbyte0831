import React, { useState } from 'react';
import { signInWithPopup, OAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AppleLoginProps {
  selectedRole?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onLoadingChange?: (loading: boolean) => void;
}

const AppleLogin: React.FC<AppleLoginProps> = ({ selectedRole, onSuccess, onError, onLoadingChange }) => {
  const { signInWithApple } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);
      onLoadingChange?.(true);
      console.log('🍎 애플 로그인 시작:', { selectedRole });

      // 임시: Apple 로그인 비활성화 메시지
      onError?.('Apple 로그인은 현재 설정 중입니다. 다른 로그인 방법을 사용해주세요.');
      return;

      // Firebase 애플 로그인 (Firebase Console에서 활성화 후 사용)
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log('🍎 Firebase 애플 로그인 성공:', {
        uid: user.uid,
        email: user.email,
        name: user.displayName
      });

      // AuthContext의 signInWithApple 함수 호출
      if (signInWithApple) {
        const appleUserData = {
          id: user.uid,
          email: user.email,
          name: user.displayName,
          profile_image: user.photoURL || '',
          email_verified: user.emailVerified,
        };

        await signInWithApple(appleUserData, selectedRole || 'jobseeker');
        
        // 현재 페이지가 회원가입 페이지인지 확인
        const currentPath = window.location.pathname;
        const isFromSignup = currentPath.includes('/signup');
        
        // 역할에 따른 대시보드 이동
        if ((selectedRole || 'jobseeker') === 'employer') {
          navigate('/employer-dashboard' + (isFromSignup ? '?signup=success' : ''));
        } else {
          navigate('/jobseeker-dashboard' + (isFromSignup ? '?signup=success' : ''));
        }
        
        onSuccess?.();
      }

    } catch (error: any) {
      console.error('🍎 애플 로그인 오류:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        onError?.('로그인이 취소되었습니다.');
      } else if (error.code === 'auth/popup-blocked') {
        onError?.('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
      } else {
        onError?.('애플 로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <button
      onClick={handleAppleLogin}
      disabled={isLoading}
      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500 mr-3"></div>
          처리 중...
        </>
      ) : (
        <>
          <svg
            className="w-5 h-5 mr-3"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Apple로 계속하기
        </>
      )}
    </button>
  );
};

export default AppleLogin;
