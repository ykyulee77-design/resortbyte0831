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

      // console.log('🔐 네이버 콜백 시작');

      try {
        // Firebase Functions 호출
        const response = await fetch('http://127.0.0.1:5002/resortbyte-dev/asia-northeast3/api/api/auth/naver/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        });

        const result = await response.json();

        if (result.success && result.user) {
          console.log('✅ 네이버 API 성공:', result.user);
          
          // 역할 파싱
          const stateParam = state || 'jobseeker';
          const [parsedRole] = stateParam.split('|');

        // 네이버 로그인 처리
        await signInWithNaver(result.user, parsedRole || 'jobseeker');

        // 역할에 따라 이동 경로 결정 (Firebase에서 반환된 역할 사용)
        const userRole = result.user.role || parsedRole || 'jobseeker';
        let redirectPath;
        
        if (userRole === 'employer') {
          // 리조트 담당자인 경우 회사 정보 완성 여부 확인
          // signInWithNaver에서 업데이트된 사용자 정보를 localStorage에서 가져옴
          const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
          
          console.log('🏢 회사 정보 확인:', {
            companyName: updatedUser.companyName,
            companyAddress: updatedUser.companyAddress,
            companyPhone: updatedUser.companyPhone,
            companyId: updatedUser.companyId
          });
          
          const hasCompleteCompanyInfo = updatedUser.companyName && 
                                       updatedUser.companyAddress && 
                                       updatedUser.companyPhone;
          
          console.log('✅ 회사 정보 완성 여부:', hasCompleteCompanyInfo);
          
          redirectPath = hasCompleteCompanyInfo 
            ? '/employer-dashboard'  // 회사 정보 완성 시 대시보드로
            : '/company/info';       // 회사 정보 미완성 시 입력 페이지로
        } else {
          redirectPath = '/jobseeker-dashboard';  // 크루 가입 시 크루 대시보드로
        }

          console.log('🚀 사용자 역할:', userRole, '이동 경로:', redirectPath);
          navigate(redirectPath, { replace: true });
          return; // 성공 시 여기서 종료

        } else {
          console.error('네이버 콜백 실패:', result);
          
          // 특정 에러 코드에 따른 처리
          if (result.errorCode === 'USER_NOT_FOUND') {
            // 등록되지 않은 사용자가 로그인 시도한 경우
            navigate('/signup?error=user_not_found&message=' + encodeURIComponent(result.error));
          } else {
            navigate('/login?error=callback_failed');
          }
        }

      } catch (error) {
        // console.error('네이버 콜백 오류:', error);
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
