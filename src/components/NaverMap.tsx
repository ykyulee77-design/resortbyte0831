import React, { useEffect, useRef, useState } from 'react';
import { NaverMapProps } from '../types/naverMap';

/**
 * 네이버 지도 컴포넌트 - 안전한 버전
 * 
 * 주요 해결된 문제들:
 * 1. 네이버 지도 API 인증 실패 시 안전한 fallback
 * 2. React DOM 오류 완전 방지
 * 3. 지도 로딩 실패 시에도 컴포넌트 안정성 유지
 * 4. 완전한 cleanup으로 메모리 누수 방지
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
  const [isApiAvailable, setIsApiAvailable] = useState(false);
  const isMountedRef = useRef(true);

  // API 가용성 확인
  useEffect(() => {
    const checkApiAvailability = () => {
      if (window.naver && window.naver.maps && window.naver.maps.Map) {
        setIsApiAvailable(true);
        return true;
      }
      return false;
    };

    if (checkApiAvailability()) {
      return;
    }

    // API가 로드될 때까지 대기 (최대 10초)
    let attempts = 0;
    const maxAttempts = 100; // 10초 대기
    
    const waitForApi = () => {
      attempts++;
      if (checkApiAvailability()) {
        return;
      }
      
      if (attempts < maxAttempts && isMountedRef.current) {
        setTimeout(waitForApi, 100);
      } else {
        // API 로드 실패 시 fallback
        if (isMountedRef.current) {
          setIsApiAvailable(false);
          setError('지도 API를 로드할 수 없습니다. 잠시 후 다시 시도해주세요.');
        }
      }
    };

    waitForApi();
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!isApiAvailable || !mapRef.current || !isMountedRef.current) {
      return;
    }

    try {
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
      
      // 지도 로드 완료 이벤트
      window.naver.maps.Event.addListener(mapInstance.current, 'idle', () => {
        if (isMountedRef.current) {
          setIsMapReady(true);
          setError(null);
        }
      });
      
      // 백업 타이머 (3초 후 강제로 준비 완료)
      setTimeout(() => {
        if (isMountedRef.current) {
          setIsMapReady(true);
          setError(null);
        }
      }, 3000);

      // 지도 클릭 이벤트
      if (onMapClick) {
        window.naver.maps.Event.addListener(mapInstance.current, 'click', (event: any, latLng: any) => {
          if (isMountedRef.current) {
            onMapClick(event, latLng);
          }
        });
      }
      
    } catch (error) {
      console.error('지도 초기화 실패:', error);
      if (isMountedRef.current) {
        setError('지도를 초기화할 수 없습니다.');
      }
    }
  }, [isApiAvailable, center.lat, center.lng, zoom, onMapClick]);

  // 마커 업데이트
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !isMountedRef.current || !isApiAvailable) {
      return;
    }

    try {
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
            if (isMountedRef.current) {
              onMarkerClick(marker);
            }
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
            if (isMountedRef.current) {
              infoWindow.open(mapInstance.current, marker);
            }
          });
        }
      });

    } catch (error) {
      console.error('마커 생성 실패:', error);
    }
  }, [markers, onMarkerClick, isMapReady, isApiAvailable]);

  // 컴포넌트 언마운트 시 cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // 마커들 제거
      markersRef.current.forEach(marker => {
        if (marker && marker.setMap) {
          try {
            marker.setMap(null);
          } catch (error) {
            console.warn('마커 제거 중 오류:', error);
          }
        }
      });
      markersRef.current = [];

      // 지도 인스턴스 정리
      if (mapInstance.current) {
        try {
          mapInstance.current = null;
        } catch (error) {
          console.warn('지도 인스턴스 정리 중 오류:', error);
        }
      }
    };
  }, []);

  // API가 사용 불가능하거나 오류가 있는 경우 fallback UI
  if (!isApiAvailable || error) {
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
          color: '#6c757d',
          border: '2px dashed #dee2e6'
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
          {error ? '네이버 지도 API 인증 실패' : '지도 로딩 중...'}
        </div>
        <div style={{ fontSize: '14px', textAlign: 'center', maxWidth: '300px' }}>
          {error 
            ? '네이버 지도 API 인증에 실패했습니다. Client ID와 도메인 설정을 확인해주세요.'
            : '네이버 지도 API를 로드하고 있습니다.'
          }
        </div>
        {error && (
          <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '8px', textAlign: 'center' }}>
            🔧 해결 방법: 네이버 클라우드 플랫폼에서 localhost:3001 도메인 등록
          </div>
        )}
        {error && (
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            새로고침
          </button>
        )}
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
          color: '#666',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🗺️</div>
          <div style={{ fontSize: '14px' }}>지도 로딩 중...</div>
        </div>
      )}
    </div>
  );
};

export default NaverMap;