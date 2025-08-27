import React from 'react';

interface NaverMapProps {
  address?: string;
  latitude?: number;
  longitude?: number;
  zoom?: number;
  height?: string;
  markerTitle?: string;
}

export default function NaverMap({
  address,
  latitude,
  longitude,
  zoom = 15,
  height = '240px',
  markerTitle = '위치'
}: NaverMapProps) {
  return (
    <div 
      style={{ 
        width: '100%', 
        height, 
        backgroundColor: '#f3f4f6',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b7280',
        fontSize: '14px'
      }}
    >
      🗺️ 지도 기능은 현재 개발 중입니다
      {address && (
        <div style={{ marginTop: '8px', fontSize: '12px' }}>
          위치: {address}
        </div>
      )}
    </div>
  );
} 