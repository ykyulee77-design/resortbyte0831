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
      KEY_ID: NAVER_MAPS_CONFIG.CLIENT_ID,
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
      
      // 전역 플래그로 인증 실패 표시 → 지도 컴포넌트에서는 렌더를 건너뜀
      (window as any).__NAVER_MAPS_AUTH_FAILED__ = true;
      setIsError(true);
      setIsLoaded(false);
    };

    // 이미 로드되어 있는지 확인 (전역 스크립트 id 기반 + window 객체 기반)
    const existingScript = document.getElementById('naver-maps-sdk') as HTMLScriptElement | null;
    if ((window as any).naver && (window as any).naver.maps) {
      console.log('네이버 지도 API가 이미 로드되어 있습니다.');
      console.log('window.naver 상태:', (window as any).naver);
      console.log('window.naver.maps 상태:', (window as any).naver.maps);
      
      // 이미 로드된 경우에도 한국어 설정 적용
      if ((window as any).naver.maps.Service && (window as any).naver.maps.Service.setLanguage) {
        (window as any).naver.maps.Service.setLanguage('ko');
        console.log('네이버 지도 API 한국어 설정 적용됨 (이미 로드된 상태)');
      }
      
      setIsLoaded(true);
      return;
    }

    // 네이버 지도 API 전용 Key ID 사용 (ncpKeyId)
    const keyId = NAVER_MAPS_CONFIG.CLIENT_ID;

    console.log('네이버 지도 API 스크립트 로딩 시작...');
    console.log('ncpKeyId:', keyId);
    
    // 기존 스크립트가 있으면 재사용 (중복 주입 방지)
    const script = existingScript ?? document.createElement('script');
    if (!existingScript) {
      script.id = 'naver-maps-sdk';
    }
    // 네이버 지도 API 스크립트 로드 (설정된 파라미터 사용)
    if (!existingScript) {
      // 신규 스펙에 맞춰 ncpKeyId 파라미터 사용
      script.src = `https://oapi.map.naver.com/openapi/${NAVER_MAPS_CONFIG.API_VERSION}/maps.js?ncpKeyId=${keyId}&submodules=${NAVER_MAPS_CONFIG.SUBMODULES.join(',')}&language=${NAVER_MAPS_CONFIG.LANGUAGE}`;
      script.async = true;
    }
    
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

    if (!existingScript) {
      document.head.appendChild(script);
      console.log('스크립트 태그가 head에 추가됨');
    } else {
      console.log('기존 네이버 지도 스크립트를 재사용합니다.');
    }

    return () => {
      // 개발모드(StrictMode)에서 이중 호출될 수 있으므로 안전하게 제거 가드
      try {
        const current = document.getElementById('naver-maps-sdk');
        // 다른 화면에서도 재사용하므로 기본적으로 스크립트를 유지
        // 필요 시 전역 해제 로직을 추가할 수 있으나, 여기서는 제거하지 않음
        // 단, 비정상적으로 head에 남았고 더 이상 참조되지 않는 임시 스크립트만 제거
        if (!current && script && (script as any).parentNode) {
          (script as any).parentNode.removeChild(script);
        }
      } catch (e) {
        // noop - 제거 실패는 치명적이지 않음
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
