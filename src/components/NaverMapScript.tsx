import React, { useEffect, useState } from 'react';

const NaverMapScript: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // 환경 변수 디버깅
    console.log('🔍 네이버 지도 API 환경 변수 확인:', {
      REACT_APP_NAVER_CLIENT_ID: process.env.REACT_APP_NAVER_CLIENT_ID,
      NODE_ENV: process.env.NODE_ENV,
      hasClientId: !!process.env.REACT_APP_NAVER_CLIENT_ID,
    });

    // 인증 실패 처리 함수 설정
    window.navermap_authFailure = function () {
      console.error('네이버 지도 API 인증 실패');
      setIsError(true);
    };

    // 이미 로드되어 있는지 확인
    if (window.naver && window.naver.maps) {
      console.log('네이버 지도 API가 이미 로드되어 있습니다.');
      console.log('window.naver 상태:', window.naver);
      console.log('window.naver.maps 상태:', window.naver.maps);
      setIsLoaded(true);
      return;
    }

    // 클라이언트 ID 설정 (개발환경에서 작동하는 키 사용)
    let clientId = process.env.REACT_APP_NAVER_CLIENT_ID || 'c4d9638auv';
    
    // 개발환경에서 작동하는 API 키가 있다면 사용
    if (clientId === 'your_naver_client_id_here') {
      console.warn('⚠️ 네이버 지도 API 키가 설정되지 않았습니다.');
      console.warn('📋 개발환경에서 작동하는 API 키를 사용합니다.');
      clientId = 'c4d9638auv'; // 개발환경에서 작동하는 실제 API 키
    }

    console.log('네이버 지도 API 스크립트 로딩 시작...');
    console.log('클라이언트 ID:', clientId);
    
    const script = document.createElement('script');
    // 새로운 API 형식: ncpKeyId 사용
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
    script.async = true;
    
    script.onload = () => {
      console.log('네이버 지도 API 스크립트 로드 완료');
      console.log('window.naver 상태:', window.naver);
      console.log('window.naver.maps 상태:', window.naver.maps);
      
      // API가 완전히 로드될 때까지 대기하는 함수
      const waitForNaverMaps = () => {
        if (window.naver && window.naver.maps && window.naver.maps.Map) {
          console.log('네이버 지도 API 완전 로드 확인됨');
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
