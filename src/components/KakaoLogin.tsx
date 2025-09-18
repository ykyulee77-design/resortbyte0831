import React, { useEffect, useState } from 'react';

interface KakaoLoginProps {
  selectedRole?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const KakaoLogin: React.FC<KakaoLoginProps> = ({ selectedRole, onError }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 카카오 SDK는 버튼 클릭 시에만 로드
    return () => {
      // 정리 작업
    };
  }, []);

  const handleKakaoLogin = async () => {
    try {
      setIsLoading(true);
      
      // 카카오 OAuth 2.0 직접 구현
      const clientId = process.env.REACT_APP_KAKAO_CLIENT_ID || 'YOUR_KAKAO_CLIENT_ID';
      
      if (!clientId || clientId === 'YOUR_KAKAO_CLIENT_ID') {
        throw new Error('카카오 클라이언트 ID가 설정되지 않았습니다.');
      }
      
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/kakao/callback`);
      const state = encodeURIComponent(`${selectedRole || 'jobseeker'}|signup`);
      
      // 카카오 로그인에서 요청할 정보 범위 설정 (전화번호 포함)
      const scope = encodeURIComponent('profile_nickname,account_email,phone_number');
      
      // 카카오 로그인 URL 생성
      const kakaoLoginUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;
      
      console.log('🟡 카카오 로그인 시작:', {
        clientId: clientId.substring(0, 8) + '...',
        redirectUri: decodeURIComponent(redirectUri),
        selectedRole,
        scope: decodeURIComponent(scope)
      });
      
      // 카카오 로그인 페이지로 리다이렉트
      window.location.href = kakaoLoginUrl;
      
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('카카오 로그인 오류:', error);
      setIsLoading(false);
      onError?.(error instanceof Error ? error.message : '카카오 로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="kakao-login-container">
      <button
        onClick={handleKakaoLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-yellow-400 text-sm font-medium text-gray-700 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 mr-2"></div>
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
              <rect width="24" height="24" rx="4" fill="#FEE500"/>
              <path
                d="M12 3C6.48 3 2 6.48 2 10.5c0 2.69 1.8 5.05 4.5 6.3L5.5 21l4.5-2.25c.5.05 1 .1 1.5.1 5.52 0 10-3.48 10-7.75S17.52 3 12 3z"
                fill="#3C1E1E"
              />
            </svg>
            카카오로 계속하기
          </>
        )}
      </button>
    </div>
  );
};

export default KakaoLogin;
