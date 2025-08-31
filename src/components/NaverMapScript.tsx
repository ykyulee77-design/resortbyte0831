import React, { useEffect, useState } from 'react';

interface NaverMapScriptProps {
  children: React.ReactNode;
}

const NaverMapScript: React.FC<NaverMapScriptProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // 환경 변수 디버깅
    console.log('환경 변수 확인:', {
      REACT_APP_NAVER_CLIENT_ID: process.env.REACT_APP_NAVER_CLIENT_ID,
      NODE_ENV: process.env.NODE_ENV,
      모든_환경변수: process.env
    });

    // 인증 실패 처리 함수 설정
    window.navermap_authFailure = function () {
      console.error('네이버 지도 API 인증 실패');
      setIsError(true);
    };

    // 이미 로드되어 있는지 확인
    if (window.naver && window.naver.maps) {
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

    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
    script.async = true;
    
    script.onload = () => {
      console.log('네이버 지도 API 로드 완료');
      // API가 완전히 로드될 때까지 잠시 대기
      setTimeout(() => {
        if (window.naver && window.naver.maps) {
          setIsLoaded(true);
        } else {
          setIsError(true);
        }
      }, 100);
    };
    
    script.onerror = () => {
      console.error('네이버 지도 API 로드 실패');
      setIsError(true);
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  if (isError) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-lg mb-2">지도 로드 실패</div>
        <p className="text-gray-600">네이버 지도 API를 불러오는데 실패했습니다.</p>
        <p className="text-sm text-gray-500 mt-2">
          환경 변수 REACT_APP_NAVER_CLIENT_ID가 올바르게 설정되어 있는지 확인해주세요.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">지도를 불러오는 중...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default NaverMapScript;
