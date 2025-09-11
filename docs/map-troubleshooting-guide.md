# 네이버 지도 문제 해결 가이드

## 주요 문제들

### 1. 무한 루프 문제 (mapRef.current가 null)
**증상**: `⏳ DOM 요소 대기 중...` 로그가 무한 반복
**원인**: `waitForElement` 함수의 재귀적 호출로 인한 무한 루프
**해결책**: 
```typescript
// ❌ 잘못된 방법 (무한 루프 발생)
const waitForElement = () => {
  if (!mapRef.current) {
    retryCount++;
    if (retryCount >= maxRetries) {
      console.error('❌ DOM 요소를 찾을 수 없습니다. 최대 재시도 횟수 초과');
      setError('지도 컨테이너를 찾을 수 없습니다.');
      return;
    }
    console.log(`⏳ DOM 요소 대기 중... (${retryCount}/${maxRetries})`);
    setTimeout(waitForElement, 100); // 무한 루프!
    return;
  }
  initializeMap();
};

// ✅ 올바른 방법 (간단한 지연 초기화)
const initializeMap = () => {
  if (!mapRef.current) {
    console.log('❌ mapRef.current가 없습니다');
    return;
  }
  // ... 지도 초기화 로직
};

// 지연 초기화
const timer = setTimeout(initializeMap, 100);
```

### 2. 조건부 렌더링 문제
**증상**: 개발환경에서 지도가 안 뜸
**원인**: `AccommodationInfo.tsx`에서 `{accommodationInfo?.address && ...}` 조건부 렌더링
**해결책**: 
```tsx
// ❌ 잘못된 방법
{accommodationInfo?.address && (
  <div className="bg-white rounded-lg border p-4">
    <NaverMap ... />
  </div>
)}

// ✅ 올바른 방법 (항상 렌더링)
<div className="bg-white rounded-lg border p-4">
  <NaverMap 
    markers={accommodationInfo?.address ? [...] : []} // 마커만 조건부
    ...
  />
</div>
```

### 3. 마커 생성 타이밍 문제
**증상**: 마커가 생성되지 않음
**원인**: 지도가 완전히 로드되기 전에 마커 생성 시도
**해결책**:
```typescript
// 마커 관리 useEffect에 isMapReady 의존성 추가
useEffect(() => {
  if (!mapInstance.current || !window.naver || !isMapReady) {
    return; // 지도가 준비될 때까지 대기
  }
  // ... 마커 생성 로직
}, [markers, onMarkerClick, isMapReady]); // isMapReady 추가
```

## 최종 작동하는 NaverMap.tsx 구조

```typescript
const NaverMap: React.FC<NaverMapProps> = ({ center, zoom, markers = [], onMapClick, onMarkerClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    // 지연 초기화 (무한 루프 방지)
    const timer = setTimeout(initializeMap, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, [center, zoom, onMapClick]);

  // 마커 관리 (isMapReady 의존성 중요!)
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

        // 마커 클릭 이벤트 및 정보창 로직...
      } catch (error) {
        console.error('마커 생성 실패:', error);
      }
    });

  }, [markers, onMarkerClick, isMapReady]);

  // 렌더링
  if (error) {
    return <div>오류: {error}</div>;
  }

  return (
    <div ref={mapRef} style={{ width: '100%', height: '100%' }}>
      {!isMapReady && (
        <div>지도 로딩 중...</div>
      )}
    </div>
  );
};
```

## 핵심 포인트

1. **무한 루프 방지**: 재귀적 `setTimeout` 대신 단순한 지연 초기화 사용
2. **조건부 렌더링 주의**: 컴포넌트는 항상 렌더링, 마커만 조건부
3. **타이밍 관리**: `isMapReady` 상태로 지도 완전 로드 후 마커 생성
4. **에러 처리**: try-catch로 안전한 초기화
5. **정리 함수**: useEffect cleanup에서 타이머 정리

## 자주 발생하는 실수

- `waitForElement` 같은 재귀 함수 사용
- `mapRef.current`가 null일 때 무한 재시도
- 지도 로드 완료 전 마커 생성 시도
- 조건부 렌더링으로 컴포넌트 자체를 숨김
- `isMapReady` 의존성 누락

이 가이드를 참고하여 앞으로 지도 관련 문제를 빠르게 해결하세요!

