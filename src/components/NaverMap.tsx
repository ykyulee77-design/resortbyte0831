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
  onMarkerClick,
  showCurrentLocation = false,
  onCurrentLocationFound
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiAvailable, setIsApiAvailable] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [currentLocationAddress, setCurrentLocationAddress] = useState<string>('');
  const isMountedRef = useRef(true);

  // 현재 위치 가져오기 함수
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.warn('현재 위치를 지원하지 않는 브라우저입니다.');
      alert('현재 위치를 지원하지 않는 브라우저입니다. 최신 브라우저를 사용해주세요.');
      return;
    }

    // 위치 권한 요청 전 사용자에게 알림
    const userConfirmed = window.confirm(
      '현재 위치를 가져오려면 위치 권한이 필요합니다. 허용하시겠습니까?'
    );
    
    if (!userConfirmed) {
      console.log('사용자가 위치 권한을 거부했습니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (isMountedRef.current) {
          setCurrentLocation({ lat, lng });
          
          // 주소 역지오코딩
          if (window.naver && window.naver.maps && window.naver.maps.Service) {
            window.naver.maps.Service.reverseGeocode({
              coords: new window.naver.maps.LatLng(lat, lng)
            }, (status: any, response: any) => {
              if (status === window.naver.maps.Service.Status.OK) {
                const address = response.result[0].address?.jibunAddress || 
                              response.result[0].address?.roadAddress || 
                              '주소를 찾을 수 없습니다';
                setCurrentLocationAddress(address);
                
                if (onCurrentLocationFound) {
                  onCurrentLocationFound({ lat, lng }, address);
                }
              } else {
                console.warn('주소 역지오코딩 실패:', status);
                setCurrentLocationAddress('주소를 찾을 수 없습니다');
              }
            });
          } else {
            setCurrentLocationAddress('주소 정보를 가져올 수 없습니다');
          }
        }
      },
      (error) => {
        let errorMessage = '현재 위치를 가져올 수 없습니다.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다. GPS가 켜져 있는지 확인해주세요.';
            break;
          case error.TIMEOUT:
            errorMessage = '위치 정보 요청 시간이 초과되었습니다. 다시 시도해주세요.';
            break;
          default:
            errorMessage = `위치 오류: ${error.message}`;
            break;
        }
        
        console.warn('현재 위치를 가져올 수 없습니다:', errorMessage);
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      }
    );
  };

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

    // 네이버 지도 객체가 부분 로드되거나 인증 실패 상태일 수 있으므로 추가 가드
    if (!window.naver || !window.naver.maps || !window.naver.maps.LatLng || !window.naver.maps.Marker) {
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

        // 방어적 체크: API 객체가 사용 가능한지 다시 확인
        if (!window.naver || !window.naver.maps || !window.naver.maps.LatLng) {
          return;
        }

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

      // 현재 위치 마커 추가
      if (showCurrentLocation && currentLocation) {
        const currentPosition = new window.naver.maps.LatLng(
          currentLocation.lat,
          currentLocation.lng
        );

        const currentLocationMarker = new window.naver.maps.Marker({
          position: currentPosition,
          map: mapInstance.current,
          title: '현재 위치',
          icon: {
            content: `
              <div style="
                width: 20px; 
                height: 20px; 
                background-color: #4285f4; 
                border: 3px solid white; 
                border-radius: 50%; 
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 12px;
                font-weight: bold;
              ">
                📍
              </div>
            `,
            size: new window.naver.maps.Size(20, 20),
            anchor: new window.naver.maps.Point(10, 10)
          }
        });

        markersRef.current.push(currentLocationMarker);

        // 현재 위치 정보창
        if (currentLocationAddress) {
          const currentLocationInfoWindow = new window.naver.maps.InfoWindow({
            content: `
              <div style="padding: 10px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #4285f4;">📍 현재 위치</h3>
                <p style="margin: 0; font-size: 14px; color: #666;">${currentLocationAddress}</p>
              </div>
            `,
            borderWidth: 0,
            backgroundColor: '#fff',
            borderRadius: '8px'
          });

          window.naver.maps.Event.addListener(currentLocationMarker, 'click', () => {
            if (isMountedRef.current) {
              currentLocationInfoWindow.open(mapInstance.current, currentLocationMarker);
            }
          });
        }
      }

    } catch (error) {
      console.error('마커 생성 실패:', error);
    }
  }, [markers, onMarkerClick, isMapReady, isApiAvailable, showCurrentLocation, currentLocation, currentLocationAddress]);

  // 현재 위치 자동 가져오기
  useEffect(() => {
    if (showCurrentLocation && isMapReady && isApiAvailable) {
      getCurrentLocation();
    }
  }, [showCurrentLocation, isMapReady, isApiAvailable]);

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
  if ((window as any).__NAVER_MAPS_AUTH_FAILED__ || !isApiAvailable || error) {
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
          {(window as any).__NAVER_MAPS_AUTH_FAILED__ || error ? '네이버 지도 API 인증 실패' : '지도 로딩 중...'}
        </div>
        <div style={{ fontSize: '14px', textAlign: 'center', maxWidth: '300px' }}>
          {(window as any).__NAVER_MAPS_AUTH_FAILED__ || error 
            ? '네이버 지도 API 인증에 실패했습니다. Client ID와 도메인 설정을 확인해주세요.'
            : '네이버 지도 API를 로드하고 있습니다.'
          }
        </div>
        {(window as any).__NAVER_MAPS_AUTH_FAILED__ && (
          <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '8px', textAlign: 'center' }}>
            🔧 해결 방법: 네이버 클라우드 플랫폼에서 localhost:3001 도메인 등록
          </div>
        )}
        {(window as any).__NAVER_MAPS_AUTH_FAILED__ && (
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
        backgroundColor: '#f0f0f0',
        position: 'relative'
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
      
      {/* 현재 위치 버튼 */}
      {showCurrentLocation && isMapReady && (
        <button
          onClick={getCurrentLocation}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            fontSize: '16px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3367d6';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4285f4';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="현재 위치로 이동"
        >
          📍
        </button>
      )}
    </div>
  );
};

export default NaverMap;