import React, { useEffect, useState } from 'react';

interface MapLoadingStateProps {
  onMapReady?: () => void;
}

const MapLoadingState: React.FC<MapLoadingStateProps> = ({ onMapReady }) => {
  const [isMapReady, setIsMapReady] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTime(prev => prev + 1);
    }, 1000);

    // 네이버 지도 API 로딩 상태 확인
    const checkMapStatus = () => {
      if (window.naver && window.naver.maps) {
        setIsMapReady(true);
        onMapReady?.();
        clearInterval(interval);
      }
    };

    // 초기 확인
    checkMapStatus();

    // 주기적으로 확인
    const statusInterval = setInterval(checkMapStatus, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, [onMapReady]);

  if (isMapReady) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-gray-100 rounded flex items-center justify-center z-10">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-sm text-gray-600 font-medium">지도를 로딩 중입니다...</p>
        <p className="text-xs text-gray-500 mt-1">잠시만 기다려주세요</p>
        <p className="text-xs text-gray-400 mt-2">로딩 시간: {loadingTime}초</p>
        
        {loadingTime > 10 && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
            <p><strong>지도 로딩이 지연되고 있습니다:</strong></p>
            <p>• 네이버 지도 API 키 확인</p>
            <p>• 브라우저 새로고침</p>
            <p>• 인터넷 연결 상태 확인</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapLoadingState;
