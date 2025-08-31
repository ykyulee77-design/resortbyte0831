# 네이버 지도 설정 가이드

## 1. 네이버 클라우드 플랫폼 설정

### 1.1 네이버 클라우드 플랫폼 가입
- [네이버 클라우드 플랫폼](https://www.ncloud.com/) 접속
- 네이버 계정으로 로그인

### 1.2 애플리케이션 등록
1. **콘솔** → **AI·NAVER API** → **Maps** → **Maps** 선택
2. **애플리케이션 등록** 클릭
3. 다음 정보 입력:
   - **애플리케이션 이름**: `resortbyte-map`
   - **서비스 환경**: `Web 서비스 URL`
   - **웹 서비스 URL**: `http://localhost:3000` (개발용)
   - **비즈니스명**: `ResortByte`

### 1.3 API 키 확인
- 등록 후 **Client ID**와 **Client Secret** 확인
- 이 키들을 환경 변수로 설정

## 2. 환경 변수 설정

### 2.1 .env 파일 생성
```env
REACT_APP_NAVER_CLIENT_ID=your_client_id_here
REACT_APP_NAVER_CLIENT_SECRET=your_client_secret_here
```

### 2.2 .env.example 파일 생성
```env
REACT_APP_NAVER_CLIENT_ID=
REACT_APP_NAVER_CLIENT_SECRET=
```

## 3. 네이버 지도 API 설치

```bash
npm install react-naver-maps
```

## 4. 타입 정의

### 4.1 네이버 지도 타입 정의
```typescript
// src/types/naverMap.ts
declare global {
  interface Window {
    naver: any;
  }
}

export interface NaverMapProps {
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
  markers?: Array<{
    position: {
      lat: number;
      lng: number;
    };
    title?: string;
    content?: string;
  }>;
}
```

## 5. 컴포넌트 구현

### 5.1 네이버 지도 컴포넌트
```typescript
// src/components/NaverMap.tsx
import React, { useEffect, useRef } from 'react';
import { NaverMapProps } from '../types/naverMap';

const NaverMap: React.FC<NaverMapProps> = ({ center, zoom, markers = [] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !window.naver) return;

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
      }
    };

    mapInstance.current = new window.naver.maps.Map(mapRef.current, mapOptions);

    // 마커 추가
    markers.forEach(markerData => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(
          markerData.position.lat,
          markerData.position.lng
        ),
        map: mapInstance.current
      });

      if (markerData.title || markerData.content) {
        const infoWindow = new window.naver.maps.InfoWindow({
          content: `
            <div style="padding: 10px;">
              <h3>${markerData.title || ''}</h3>
              <p>${markerData.content || ''}</p>
            </div>
          `
        });

        window.naver.maps.Event.addListener(marker, 'click', () => {
          infoWindow.open(mapInstance.current, marker);
        });
      }
    });
  }, [center, zoom, markers]);

  return (
    <div 
      ref={mapRef} 
      style={{ width: '100%', height: '400px' }}
    />
  );
};

export default NaverMap;
```

### 5.2 네이버 지도 스크립트 로더
```typescript
// src/components/NaverMapScript.tsx
import React, { useEffect } from 'react';

interface NaverMapScriptProps {
  children: React.ReactNode;
}

const NaverMapScript: React.FC<NaverMapScriptProps> = ({ children }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.REACT_APP_NAVER_CLIENT_ID}`;
    script.async = true;
    script.onload = () => {
      console.log('네이버 지도 API 로드 완료');
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return <>{children}</>;
};

export default NaverMapScript;
```

## 6. 사용 예시

### 6.1 JobPostDetail 페이지에 지도 추가
```typescript
// src/pages/JobPostDetail.tsx
import NaverMap from '../components/NaverMap';

// 컴포넌트 내부에서 사용
const mapCenter = {
  lat: 37.5665, // 서울 시청 좌표 (예시)
  lng: 126.9780
};

<NaverMap 
  center={mapCenter}
  zoom={15}
  markers={[
    {
      position: mapCenter,
      title: jobPost.title,
      content: jobPost.location
    }
  ]}
/>
```

## 7. 주소 검색 기능

### 7.1 주소-좌표 변환 유틸리티
```typescript
// src/utils/geocoding.ts
export const searchAddress = async (address: string) => {
  const response = await fetch(
    `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`,
    {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': process.env.REACT_APP_NAVER_CLIENT_ID!,
        'X-NCP-APIGW-API-KEY': process.env.REACT_APP_NAVER_CLIENT_SECRET!
      }
    }
  );

  const data = await response.json();
  
  if (data.addresses && data.addresses.length > 0) {
    const addressData = data.addresses[0];
    return {
      lat: parseFloat(addressData.y),
      lng: parseFloat(addressData.x),
      address: addressData.roadAddress || addressData.jibunAddress
    };
  }
  
  return null;
};
```

## 8. 배포 시 주의사항

### 8.1 도메인 등록
- 프로덕션 도메인을 네이버 클라우드 플랫폼에 등록
- 예: `https://yourdomain.com`

### 8.2 환경 변수 설정
- 프로덕션 환경에서 환경 변수 설정
- Vercel, Netlify 등 배포 플랫폼에서 환경 변수 추가

## 9. 테스트

### 9.1 로컬 테스트
```bash
npm start
```
- http://localhost:3000 에서 지도 기능 확인

### 9.2 기능 테스트
- 지도 로딩 확인
- 마커 표시 확인
- 줌 인/아웃 확인
- 주소 검색 기능 확인
