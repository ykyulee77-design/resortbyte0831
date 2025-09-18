import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signInWithCustomToken, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { removeAutoLoginToken } from '../utils/autoLogin';

const NaverCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithNaver } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const processedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    const handleNaverCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        console.error('네이버 로그인 오류:', error);
        navigate('/login?error=naver_login_error');
        return;
      }

      if (!code) {
        console.error('네이버 로그인 코드가 없습니다.');
        navigate('/login?error=naver_no_code');
        return;
      }

      // 중복 처리 방지 (단, 이미 처리된 코드라도 navigate는 허용)
      if (processedCodeRef.current === code && isProcessing) {
        console.log('현재 처리 중인 코드입니다.');
        return;
      }

      // 이미 처리된 코드인 경우 바로 대시보드로 이동
        if (processedCodeRef.current === code && !isProcessing) {
          console.log('이미 처리된 코드 - 바로 대시보드로 이동');
          const stateParam = state || 'jobseeker';
          const [parsedRole] = stateParam.split('|');
          
          const dashboardPath = (parsedRole || 'jobseeker') === 'employer' 
            ? '/employer-dashboard' 
            : '/jobseeker-dashboard';
          
          navigate(dashboardPath, { replace: true });
          return;
        }

      processedCodeRef.current = code;
      setIsProcessing(true);

      try {
        console.log('네이버 콜백 처리 시작:', { code: code.substring(0, 10) + '...', state });

        // Firebase Functions 직접 호출 (개발 환경)
        const apiUrl = 'http://localhost:5002/resortbyte-dev/asia-northeast3/api/api';
        
        const response = await fetch(`${apiUrl}/auth/naver/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        });

        const contentType = response.headers.get('content-type') || '';
        let result: any;
        
        if (contentType.includes('application/json')) {
          result = await response.json();
        } else {
          const rawText = await response.text();
          console.error('네이버 콜백 비-JSON 응답:', rawText.slice(0, 200));
          navigate('/login?error=naver_callback_non_json');
          return;
        }

        if (result.success) {
          const stateParam = state || 'jobseeker';
          const [parsedRole, parsedSource] = stateParam.split('|');
          const isFromSignup = parsedSource === 'signup';

          console.log('네이버 콜백 성공:', { 
            parsedRole, 
            parsedSource, 
            isFromSignup,
            user: result.user 
          });

          if (result.customToken) {
            // 커스텀 토큰이 있는 경우 (운영 환경)
            try {
              const userCredential = await signInWithCustomToken(auth, result.customToken);
              const user = userCredential.user;
              console.log('✅ Firebase 커스텀 토큰 로그인 성공');
              
              if (signInWithNaver) {
                await signInWithNaver(result.user, parsedRole || 'jobseeker');
                
                if (isFromSignup) {
                  if ((parsedRole || 'jobseeker') === 'employer') {
                    navigate('/employer-dashboard?signup=success');
                  } else {
                    navigate('/jobseeker-dashboard?signup=success');
                  }
                } else {
                  if ((parsedRole || 'jobseeker') === 'employer') {
                    navigate('/employer-dashboard');
                  } else {
                    navigate('/jobseeker-dashboard');
                  }
                }
              }
            } catch (error) {
              console.error('Firebase 커스텀 토큰 로그인 실패:', error);
              console.log('🔄 fallback 로직 시작 - 커스텀 토큰 없이 처리');
              
              // 커스텀 토큰 실패 시 사용자 정보만으로 처리
              if (signInWithNaver) {
                await signInWithNaver(result.user, parsedRole || 'jobseeker');
                console.log('✅ fallback signInWithNaver 완료');
                
                // 즉시 네비게이션 (로그 간소화)
                const dashboardPath = (parsedRole || 'jobseeker') === 'employer' 
                  ? '/employer-dashboard' + (isFromSignup ? '?signup=success' : '')
                  : '/jobseeker-dashboard' + (isFromSignup ? '?signup=success' : '');
                
                console.log('🚀 대시보드로 즉시 이동:', dashboardPath);
                navigate(dashboardPath, { replace: true });
              }
            }
          } else if (result.user) {
            // 커스텀 토큰이 없는 경우 (개발 환경)
            console.log('⚠️ 개발 환경: 커스텀 토큰 없이 사용자 정보만 처리');
            
            if (signInWithNaver) {
              await signInWithNaver(result.user, parsedRole || 'jobseeker');
              
              // 즉시 네비게이션
              const dashboardPath = (parsedRole || 'jobseeker') === 'employer' 
                ? '/employer-dashboard' + (isFromSignup ? '?signup=success' : '')
                : '/jobseeker-dashboard' + (isFromSignup ? '?signup=success' : '');
              
              console.log('🚀 대시보드로 즉시 이동:', dashboardPath);
              navigate(dashboardPath, { replace: true });
            }
          }
        } else {
          console.error('네이버 콜백 실패:', result);
          navigate('/login?error=naver_callback_failed');
        }
      } catch (error) {
        console.error('네이버 콜백 처리 실패:', error);
        navigate('/login?error=naver_callback_failed');
      } finally {
        setIsProcessing(false);
      }
    };

    handleNaverCallback();
  }, [searchParams, navigate, signInWithNaver, isProcessing]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            네이버 로그인 처리 중...
          </h2>
          <p className="text-gray-600 text-sm">
            잠시만 기다려주세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NaverCallback;