import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface GoogleLoginProps {
  selectedRole?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onLoadingChange?: (loading: boolean) => void;
}

const GoogleLogin: React.FC<GoogleLoginProps> = ({ selectedRole, onSuccess, onError, onLoadingChange }) => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      onLoadingChange?.(true);
      console.log('🔵 구글 로그인 시작:', { selectedRole });

      // Firebase 구글 로그인
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log('🔵 Firebase 구글 로그인 성공:', {
        uid: user.uid,
        email: user.email,
        name: user.displayName
      });

      // AuthContext의 signInWithGoogle 함수 호출
      if (signInWithGoogle) {
        const googleUserData = {
          id: user.uid,
          email: user.email,
          name: user.displayName,
          profile_image: user.photoURL || '',
          email_verified: user.emailVerified,
        };

        await signInWithGoogle(googleUserData, selectedRole || 'jobseeker');
        
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
      console.error('🔵 구글 로그인 오류:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        onError?.('로그인이 취소되었습니다.');
      } else if (error.code === 'auth/popup-blocked') {
        onError?.('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
      } else {
        onError?.('구글 로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <div className="google-login-container">
      <button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
            처리 중...
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google로 계속하기
          </>
        )}
      </button>
    </div>
  );
};

export default GoogleLogin;