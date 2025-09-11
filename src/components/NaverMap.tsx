import React, { useEffect, useRef, useState } from 'react';
import { NaverMapProps } from '../types/naverMap';

/**
 * 네이버 지도 컴포넌트
 * 
 * 주요 해결된 문제들:
 * 1. 무한 루프 방지: waitForElement 재귀 함수 제거, 단순한 setTimeout 사용
 * 2. 조건부 렌더링: 컴포넌트는 항상 렌더링, 마커만 조건부
 * 3. 타이밍 관리: isMapReady 상태로 지도 완전 로드 후 마커 생성
 * 4. 에러 처리: try-catch로 안전한 초기화
 * 
 * 자세한 내용은 docs/map-troubleshooting-guide.md 참고
 */

const NaverMap: React.FC<NaverMapProps> = ({ 
  center, 
  zoom, 
  markers = [], 
  onMapClick,
  onMarkerClick 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🗺️ NaverMap useEffect 시작');
    
    // 간단한 초기화 함수
    const initializeMap = () => {
      if (!mapRef.current) {
        console.log('❌ mapRef.current가 없습니다');
        return;
      }

      if (!window.naver || !window.naver.maps) {
        console.log('⏳ 네이버 지도 API 로드 대기 중...');
        setTimeout(initializeMap, 200);
        return;
      }

      try {
        console.log('🗺️ 지도 초기화 시작...');
        
        const mapOptions = {
          center: new window.naver.maps.LatLng(center.lat, center.lng),
          zoom: zoom,
          mapTypeControl: true,
          zoomControl: true,
          scaleControl: true,
          logoControl: true,
          mapDataControl: true
        };

        mapInstance.current = new window.naver.maps.Map(mapRef.current, mapOptions);
        console.log('✅ 지도 인스턴스 생성 완료');
        
        // 지도 로드 완료 이벤트
        window.naver.maps.Event.addListener(mapInstance.current, 'idle', () => {
          console.log('지도 로드 완료');
          setIsMapReady(true);
        });
        
        // 백업 타이머
        setTimeout(() => {
          setIsMapReady(true);
        }, 1000);

        // 지도 클릭 이벤트
        if (onMapClick) {
          window.naver.maps.Event.addListener(mapInstance.current, 'click', (e: any) => {
            const lat = e.coord.lat();
            const lng = e.coord.lng();
            onMapClick(lat, lng);
          });
        }

      } catch (err) {
        console.error('네이버 지도 초기화 오류:', err);
        setError('지도를 로드하는 중 오류가 발생했습니다.');
      }
    };

    // 지연 초기화
    const timer = setTimeout(initializeMap, 100);
    
    return () => {
      clearTimeout(timer);
      console.log('🧹 NaverMap useEffect cleanup');
    };
  }, [center, zoom, onMapClick]);

  // 마커 관리
  useEffect(() => {
    if (!mapInstance.current || !window.naver || !isMapReady) {
      return;
    }

    // 기존 마커들 제거
    markersRef.current.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    // 새 마커들 추가
    markers.forEach((markerData) => {
      if (!markerData.position) return;

      try {
        const position = new window.naver.maps.LatLng(
          markerData.position.lat,
          markerData.position.lng
        );

        const marker = new window.naver.maps.Marker({
          position: position,
          map: mapInstance.current,
          title: markerData.title || '위치'
        });

        markersRef.current.push(marker);

        // 마커 클릭 이벤트
        if (onMarkerClick) {
          window.naver.maps.Event.addListener(marker, 'click', () => {
            onMarkerClick(marker);
          });
        }

        // 정보창 추가
        if (markerData.title || markerData.content) {
          const infoWindow = new window.naver.maps.InfoWindow({
            content: `
              <div style="padding: 10px; min-width: 200px;">
                ${markerData.title ? `<h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${markerData.title}</h3>` : ''}
                ${markerData.content ? `<p style="margin: 0; font-size: 14px; color: #666;">${markerData.content}</p>` : ''}
              </div>
            `,
            borderWidth: 0,
            backgroundColor: '#fff',
            borderRadius: '8px'
          });

          window.naver.maps.Event.addListener(marker, 'click', () => {
            if (infoWindow.getMap()) {
              infoWindow.close();
            } else {
              infoWindow.open(mapInstance.current, marker);
            }
          });
        }
      } catch (error) {
        console.error('마커 생성 실패:', error);
      }
    });

  }, [markers, onMarkerClick, isMapReady]);

  // 오류가 있으면 오류 메시지 표시
  if (error) {
    return (
      <div 
        style={{ 
          width: '100%', 
          height: '400px',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#6c757d'
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🗺️</div>
        <div style={{ fontSize: '14px', textAlign: 'center' }}>{error}</div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#f0f0f0'
      }}
    >
      {!isMapReady && (
        <div style={{ 
          width: '100%', 
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#666'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🗺️</div>
          <div>지도 로딩 중...</div>
        </div>
      )}
    </div>
  );
};

export default NaverMap; 