import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase';

const KakaoCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithKakao } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const processedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    const handleKakaoCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        console.log('🟡 카카오 콜백 처리 시작:', { code: code?.substring(0, 10) + '...', state });

        if (!code) {
          console.error('❌ 카카오 인증 코드가 없습니다.');
          navigate('/login?error=no_code');
          return;
        }

        // 중복 처리 방지
        if (processedCodeRef.current === code && isProcessing) {
          console.log('⏳ 현재 처리 중인 코드입니다.');
          return;
        }
        if (processedCodeRef.current === code && !isProcessing) {
          console.log('✅ 이미 처리된 코드 - 바로 대시보드로 이동');
          const stateParam = state || 'jobseeker';
          const [parsedRole] = stateParam.split('|');
          
          if ((parsedRole || 'jobseeker') === 'employer') {
            navigate('/employer-dashboard');
          } else {
            navigate('/jobseeker-dashboard');
          }
          return;
        }

        processedCodeRef.current = code;
        setIsProcessing(true);

        // state 파싱 (role|source 형태)
        const stateParam = state || 'jobseeker';
        const [parsedRole, parsedSource] = stateParam.split('|');
        const isFromSignup = parsedSource === 'signup';

        console.log('🔍 상태 파싱:', { parsedRole, parsedSource, isFromSignup });

        // Firebase Functions에 카카오 콜백 요청
        const apiUrl = 'http://localhost:5002/resortbyte-dev/asia-northeast3/api/api';
        const response = await fetch(`${apiUrl}/auth/kakao/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('🟡 카카오 콜백 비-JSON 응답:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('🟡 카카오 콜백 성공:', { parsedRole, parsedSource, isFromSignup, user: result.user });

        if (!result.success) {
          console.error('❌ 카카오 로그인 실패:', result.error);
          navigate('/login?error=kakao_login_failed');
          return;
        }

        // Firebase 커스텀 토큰으로 로그인 시도
        if (result.customToken) {
          try {
            const userCredential = await signInWithCustomToken(auth, result.customToken);
            const user = userCredential.user;
            console.log('✅ Firebase 커스텀 토큰 로그인 성공');
            
            if (signInWithKakao) {
              await signInWithKakao(result.user, parsedRole || 'jobseeker');
              
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
            
            if (signInWithKakao) {
              await signInWithKakao(result.user, parsedRole || 'jobseeker');
              console.log('✅ fallback signInWithKakao 완료');
              
              if (isFromSignup) {
                console.log('📍 회원가입 플로우 - 대시보드로 이동');
                if ((parsedRole || 'jobseeker') === 'employer') {
                  console.log('🏢 리조트 대시보드로 이동');
                  navigate('/employer-dashboard?signup=success');
                } else {
                  console.log('👤 구직자 대시보드로 이동');
                  navigate('/jobseeker-dashboard?signup=success');
                }
              } else {
                console.log('📍 로그인 플로우 - 대시보드로 이동');
                if ((parsedRole || 'jobseeker') === 'employer') {
                  console.log('🏢 리조트 대시보드로 이동');
                  navigate('/employer-dashboard');
                } else {
                  console.log('👤 구직자 대시보드로 이동');
                  navigate('/jobseeker-dashboard');
                }
              }
            }
          }
        } else if (result.user) {
          // Fallback for development without custom token
          console.log('⚠️ 개발 환경: 커스텀 토큰 없이 사용자 정보만 처리');
          
          if (signInWithKakao) {
            await signInWithKakao(result.user, parsedRole || 'jobseeker');
            
            if (isFromSignup) {
              console.log('🆕 회원가입 플로우 - 새 사용자 등록');
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
        }

      } catch (error) {
        console.error('🟡 카카오 콜백 실패:', error);
        navigate('/login?error=kakao_callback_error');
      } finally {
        setIsProcessing(false);
      }
    };

    handleKakaoCallback();
  }, [searchParams, navigate, signInWithKakao]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            카카오 로그인 처리 중...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            잠시만 기다려주세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default KakaoCallback;
