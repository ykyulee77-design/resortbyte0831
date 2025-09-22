import React, { useEffect, useState } from 'react';
import { NAVER_MAPS_CONFIG, validateNaverApiConfig } from '../config/naverApi';

const NaverMapScript: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // 네이버 API 설정 검증
    validateNaverApiConfig();
    
    // 환경 변수 디버깅
    console.log('🗺️ 네이버 지도 API 설정 확인:', {
      CLIENT_ID: NAVER_MAPS_CONFIG.CLIENT_ID,
      API_VERSION: NAVER_MAPS_CONFIG.API_VERSION,
      SUBMODULES: NAVER_MAPS_CONFIG.SUBMODULES,
      LANGUAGE: NAVER_MAPS_CONFIG.LANGUAGE,
      NODE_ENV: process.env.NODE_ENV,
    });

    // 인증 실패 처리 함수 설정
    window.navermap_authFailure = function () {
      console.warn('🚨 네이버 지도 API 인증 실패 - fallback 모드로 전환');
      console.warn('📋 가능한 원인:');
      console.warn('  1. Client ID가 올바르지 않음');
      console.warn('  2. 도메인(localhost:3001)이 등록되지 않음');
      console.warn('  3. API 사용량 한도 초과');
      console.warn('  4. 네이버 클라우드 플랫폼 설정 오류');
      
      // 인증 실패해도 앱이 계속 작동하도록 오류로 처리하지 않음
      setIsError(false);
      setIsLoaded(true); // fallback 모드로 전환
    };

    // 이미 로드되어 있는지 확인
    if (window.naver && window.naver.maps) {
      console.log('네이버 지도 API가 이미 로드되어 있습니다.');
      console.log('window.naver 상태:', window.naver);
      console.log('window.naver.maps 상태:', window.naver.maps);
      
      // 이미 로드된 경우에도 한국어 설정 적용
      if (window.naver.maps.Service && window.naver.maps.Service.setLanguage) {
        window.naver.maps.Service.setLanguage('ko');
        console.log('네이버 지도 API 한국어 설정 적용됨 (이미 로드된 상태)');
      }
      
      setIsLoaded(true);
      return;
    }

    // 네이버 지도 API 전용 클라이언트 ID 사용
    const clientId = NAVER_MAPS_CONFIG.CLIENT_ID;

    console.log('네이버 지도 API 스크립트 로딩 시작...');
    console.log('클라이언트 ID:', clientId);
    
    const script = document.createElement('script');
    // 네이버 지도 API 스크립트 로드 (설정된 파라미터 사용)
    script.src = `https://oapi.map.naver.com/openapi/${NAVER_MAPS_CONFIG.API_VERSION}/maps.js?ncpKeyId=${clientId}&submodules=${NAVER_MAPS_CONFIG.SUBMODULES.join(',')}&language=${NAVER_MAPS_CONFIG.LANGUAGE}`;
    script.async = true;
    
    script.onload = () => {
      console.log('네이버 지도 API 스크립트 로드 완료');
      console.log('window.naver 상태:', window.naver);
      console.log('window.naver.maps 상태:', window.naver.maps);
      
      // API가 완전히 로드될 때까지 대기하는 함수
      const waitForNaverMaps = () => {
        if (window.naver && window.naver.maps && window.naver.maps.Map) {
          console.log('네이버 지도 API 완전 로드 확인됨');
          
          // 한국어 설정 적용
          if (window.naver.maps.Service && window.naver.maps.Service.setLanguage) {
            window.naver.maps.Service.setLanguage('ko');
            console.log('네이버 지도 API 한국어 설정 적용됨');
          }
          
          setIsLoaded(true);
        } else {
          console.log('네이버 지도 API 로드 대기 중...');
          setTimeout(waitForNaverMaps, 100);
        }
      };
      
      // API가 완전히 로드될 때까지 대기
      waitForNaverMaps();
    };
    
    script.onerror = (error) => {
      console.error('네이버 지도 API 스크립트 로드 실패:', error);
      setIsError(true);
    };

    document.head.appendChild(script);
    console.log('스크립트 태그가 head에 추가됨');

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // 에러나 로딩 상태는 콘솔에만 표시하고 UI에는 표시하지 않음
  if (isError) {
    console.error('네이버 지도 API 로드 실패');
  }

  if (!isLoaded) {
    console.log('네이버 지도 API 로딩 중...');
  }

  // 컴포넌트는 아무것도 렌더링하지 않음 (스크립트만 로드)
  return null;
};

export default NaverMapScript;
