import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SimpleNaverCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithNaver } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // 중복 실행 방지
      if (processedRef.current) return;
      processedRef.current = true;

      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code) {
        navigate('/login?error=no_code');
        return;
      }

      console.log('🔐 네이버 콜백 시작');

      try {
        // Firebase Functions 호출
        const response = await fetch('http://localhost:5002/resortbyte-dev/asia-northeast3/api/api/auth/naver/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state })
        });

        const result = await response.json();

        if (result.success && result.user) {
          console.log('✅ 네이버 API 성공');
          
          // 역할 파싱
          const stateParam = state || 'jobseeker';
          const [parsedRole] = stateParam.split('|');

          // 네이버 로그인 처리
          await signInWithNaver(result.user, parsedRole || 'jobseeker');

          // 대시보드로 이동
          const dashboardPath = (parsedRole || 'jobseeker') === 'employer' 
            ? '/employer-dashboard' 
            : '/jobseeker-dashboard';

          console.log('🚀 대시보드로 이동:', dashboardPath);
          navigate(dashboardPath, { replace: true });
          return; // 성공 시 여기서 종료

        } else {
          console.error('네이버 콜백 실패:', result);
          navigate('/login?error=callback_failed');
        }

      } catch (error) {
        console.error('네이버 콜백 오류:', error);
        navigate('/login?error=network_error');
      }
    };

    handleCallback();
  }, [searchParams, navigate, signInWithNaver]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">네이버 로그인 처리 중...</p>
      </div>
    </div>
  );
};

export default SimpleNaverCallback;
