import React, { useEffect, useState } from 'react';

const NaverMapScript: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // 환경 변수 디버깅
    console.log('환경 변수 확인:', {
      REACT_APP_NAVER_CLIENT_ID: process.env.REACT_APP_NAVER_CLIENT_ID,
      NODE_ENV: process.env.NODE_ENV,
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

    // 클라이언트 ID가 없으면 오류
    const clientId = process.env.REACT_APP_NAVER_CLIENT_ID;
    if (!clientId) {
      console.error('REACT_APP_NAVER_CLIENT_ID가 설정되지 않았습니다.');
      setIsError(true);
      return;
    }

    console.log('네이버 지도 API 스크립트 로딩 시작...');
    console.log('클라이언트 ID:', clientId);
    
    const script = document.createElement('script');
    // 공식 문서 기준 파라미터명은 ncpClientId 입니다 (이전 ncpKeyId 사용 시 로드 실패)
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`;
    script.async = true;
    
    script.onload = () => {
      console.log('네이버 지도 API 스크립트 로드 완료');
      console.log('window.naver 상태:', window.naver);
      console.log('window.naver.maps 상태:', window.naver.maps);
      
      // API가 완전히 로드될 때까지 잠시 대기
      setTimeout(() => {
        if (window.naver && window.naver.maps) {
          console.log('네이버 지도 API 초기화 완료');
          console.log('Service 모듈 확인:', window.naver.maps.Service);
          setIsLoaded(true);
        } else {
          console.error('네이버 지도 API 초기화 실패');
          console.log('window.naver 상태:', window.naver);
          setIsError(true);
        }
      }, 500); // 대기 시간을 500ms로 증가
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
