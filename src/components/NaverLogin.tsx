import React, { useEffect, useState } from 'react';

interface NaverLoginProps {
  selectedRole?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

// 네이버 지도 API 타입은 src/types/naverMap.ts에서 정의됨

const NaverLogin: React.FC<NaverLoginProps> = ({ selectedRole, onError }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 네이버 SDK는 버튼 클릭 시에만 로드
    return () => {
      // 정리 작업
    };
  }, []);

  const handleNaverLogin = async () => {
    try {
      setIsLoading(true);
      
      // 네이버 OAuth 2.0 직접 구현
      const clientId = process.env.REACT_APP_NAVER_CLIENT_ID || 'R0oImlUQC6DqKKV_V5BR';
      
      if (!clientId) {
        throw new Error('네이버 클라이언트 ID가 설정되지 않았습니다.');
      }
      
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/naver/callback`);
      
      // 현재 페이지 정보를 state에 포함
      const currentPath = window.location.pathname;
      const isFromSignup = currentPath.includes('/signup');
      const stateWithPath = `${selectedRole || 'jobseeker'}|${isFromSignup ? 'signup' : 'login'}`;
      const state = encodeURIComponent(stateWithPath);
      
      // 네이버 로그인에서 요청할 정보 범위 설정
      const scope = encodeURIComponent('name,email,mobile');
      
      // 네이버 로그인 URL 생성 (휴대전화번호 포함)
      const naverLoginUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;
      
      console.log('🔍 현재 페이지 정보:', { currentPath, isFromSignup, stateWithPath });
      
      // eslint-disable-next-line no-console
      console.log('네이버 로그인 URL:', naverLoginUrl);
      
      // 네이버 로그인 페이지로 리다이렉트
      window.location.href = naverLoginUrl;
      
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('네이버 로그인 오류:', error);
      setIsLoading(false);
      onError?.(error instanceof Error ? error.message : '네이버 로그인 중 오류가 발생했습니다.');
    }
  };


  return (
    <div className="naver-login-container">
      <button
        onClick={handleNaverLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500 mr-2"></div>
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
              <rect width="24" height="24" rx="4" fill="#03C75A"/>
              <path
                d="M16.273 12.845L13.376 8.5H11.624L8.727 12.845L11.624 17.19H13.376L16.273 12.845Z"
                fill="white"
              />
            </svg>
            네이버로 계속하기
          </>
        )}
      </button>
    </div>
  );
};

export default NaverLogin;
