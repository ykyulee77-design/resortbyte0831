import React, { useEffect, useRef, useState } from 'react';
import { NaverMapProps } from '../types/naverMap';

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
    if (!mapRef.current) return;
    
    // 네이버 지도 API가 로드되었는지 확인
    if (!window.naver || !window.naver.maps) {
      setError('네이버 지도 API가 로드되지 않았습니다.');
      return;
    }

    try {
            // API 객체들이 존재하는지 확인
      if (!window.naver.maps.LatLng || !window.naver.maps.Map) {
        setError('네이버 지도 API 객체를 찾을 수 없습니다.');
        return;
      }

      const mapOptions = {
        center: new window.naver.maps.LatLng(center.lat, center.lng),
        zoom: zoom,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.naver.maps.MapTypeControlStyle.DROPDOWN
        },
        zoomControl: true,
        zoomControlOptions: {
          style: window.naver.maps.ZoomControlStyle.SMALL,
          position: window.naver.maps.Position.TOP_RIGHT
        },
        scaleControl: true,
        logoControl: true,
        mapDataControl: true
      };

      mapInstance.current = new window.naver.maps.Map(mapRef.current, mapOptions);
      setIsMapReady(true);
      setError(null);

      // 지도 클릭 이벤트
      if (onMapClick) {
        window.naver.maps.Event.addListener(mapInstance.current, 'click', (e: any) => {
          const lat = e.coord.lat();
          const lng = e.coord.lng();
          onMapClick(lat, lng);
        });
      }

      return () => {
        if (mapInstance.current) {
          window.naver.maps.Event.clearListeners(mapInstance.current, 'click');
        }
      };
    } catch (err) {
      console.error('네이버 지도 초기화 오류:', err);
      setError('지도를 로드하는 중 오류가 발생했습니다.');
    }
  }, [center, zoom, onMapClick]);

  // 마커 관리
  useEffect(() => {
    if (!mapInstance.current || !window.naver || !isMapReady) {
      console.log('마커 생성 조건 미충족:', {
        hasMapInstance: !!mapInstance.current,
        hasNaver: !!window.naver,
        isMapReady
      });
      return;
    }

    console.log('마커 데이터:', markers);
    console.log('지도 인스턴스:', mapInstance.current);

    // 기존 마커들 제거
    markersRef.current.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    // 새 마커들 추가
    markers.forEach((markerData, index) => {
      console.log(`마커 ${index} 생성 시도:`, markerData);

      // 좌표 유효성 검사
      if (!markerData.position || 
          typeof markerData.position.lat !== 'number' || 
          typeof markerData.position.lng !== 'number') {
        console.error(`마커 ${index} 좌표가 유효하지 않음:`, markerData.position);
        return;
      }

      let marker: any = null;
      
      try {
        const position = new window.naver.maps.LatLng(
          markerData.position.lat,
          markerData.position.lng
        );
        
        console.log(`마커 ${index} 위치:`, position);

        marker = new window.naver.maps.Marker({
          position: position,
          map: mapInstance.current,
          title: markerData.title || '위치'
        });

        console.log(`마커 ${index} 생성 성공:`, marker);
        markersRef.current.push(marker);

        // 마커 클릭 이벤트
        if (onMarkerClick && marker) {
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
            borderRadius: '8px',
            anchorSize: new window.naver.maps.Size(10, 10),
            anchorColor: '#fff'
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
        console.error(`마커 ${index} 생성 실패:`, error);
        return; // 마커 생성 실패 시 다음 마커로 넘어감
      }
    });

    console.log('마커 생성 완료, 총 마커 수:', markersRef.current.length);

    return () => {
      markersRef.current.forEach(marker => {
        if (marker) {
          window.naver.maps.Event.clearListeners(marker, 'click');
        }
      });
    };
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
        <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
          잠시 후 다시 시도해주세요
        </div>
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
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}
    />
  );
};

export default NaverMap; 