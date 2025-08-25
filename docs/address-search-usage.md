# 주소 검색 컴포넌트 사용 가이드

## 개요

`AddressSearch` 컴포넌트는 공공데이터 포털 API를 활용한 실시간 주소 검색 기능을 제공합니다. 지도 연동을 고려하여 설계되었으며, 상세주소 입력 기능을 포함한 확장 가능한 구조로 구성되어 있습니다.

## 주요 기능

- ✅ 실시간 주소 검색 (공공데이터 포털 API)
- ✅ 검색 결과 드롭다운 표시
- ✅ 상세주소 입력 필드 (아파트 동/호수, 사무실 번호 등)
- ✅ 선택된 주소 미리보기
- ✅ 디바운스 처리 (300ms)
- ✅ 에러 처리 및 폴백 데이터
- ✅ 검색어 검증 (특수문자, SQL 인젝션 방지)
- ✅ 지도 연동 준비 (좌표 정보 포함)
- ✅ 주소 히스토리 관리
- ✅ 반응형 UI

## 기본 사용법

```tsx
import AddressSearch, { Address } from '../components/AddressSearch';

function MyComponent() {
  const handleAddressSelect = (address: Address) => {
    console.log('선택된 주소:', address);
    // 폼 데이터 업데이트 또는 지도 마커 표시
  };

  return (
    <AddressSearch
      onAddressSelect={handleAddressSelect}
      placeholder="회사 주소를 검색하세요"
      value={formData.companyAddress}
    />
  );
}
```

## 고급 사용법

```tsx
<AddressSearch
  onAddressSelect={handleAddressSelect}
  placeholder="상세 주소를 검색하세요"
  value={selectedAddress}
  className="w-full"
  disabled={isLoading}
  minSearchLength={3}
  maxResults={15}
  showDetailAddress={true}
  detailAddressPlaceholder="상세주소 (아파트 동/호수, 사무실 번호 등)"
/>
```

## Address 인터페이스

```typescript
interface Address {
  // 기본 주소 정보
  zipCode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
  
  // 상세주소 (사용자 입력)
  detailAddress?: string;
  
  // 지역 정보 (지도 마커 표시용)
  region?: string;
  sido?: string;
  sigungu?: string;
  emdNm?: string; // 읍면동
  
  // 지도 연동을 위한 좌표 정보 (향후 추가 예정)
  latitude?: number;
  longitude?: number;
  
  // 상세 주소 정보 (지도 표시용)
  buildingName?: string;
  roadName?: string;
  buildingNumber?: string;
  admCd?: string; // 행정구역코드
  
  // 영어 주소 (국제화 지원)
  engAddress?: string;
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onAddressSelect` | `(address: Address) => void` | - | 주소 선택 시 호출되는 콜백 |
| `placeholder` | `string` | `'주소를 검색하세요'` | 입력 필드 플레이스홀더 |
| `value` | `string` | `''` | 입력 필드 값 |
| `className` | `string` | `''` | 추가 CSS 클래스 |
| `disabled` | `boolean` | `false` | 입력 필드 비활성화 |
| `minSearchLength` | `number` | `3` | 최소 검색어 길이 |
| `maxResults` | `number` | `10` | 최대 검색 결과 수 |
| `showDetailAddress` | `boolean` | `true` | 상세주소 필드 표시 여부 |
| `detailAddressPlaceholder` | `string` | `'상세주소 (아파트 동/호수, 사무실 번호 등)'` | 상세주소 플레이스홀더 |

## 사용 시나리오

### 1. 기본 주소 검색 (상세주소 없음)

```tsx
<AddressSearch
  onAddressSelect={handleAddressSelect}
  showDetailAddress={false}
  placeholder="간단한 주소 검색"
/>
```

### 2. 상세주소 포함 주소 검색

```tsx
<AddressSearch
  onAddressSelect={handleAddressSelect}
  showDetailAddress={true}
  detailAddressPlaceholder="아파트 동/호수 또는 사무실 번호"
/>
```

### 3. 회사 주소 등록

```tsx
<AddressSearch
  onAddressSelect={(address) => {
    setFormData(prev => ({
      ...prev,
      companyAddress: address.address,
      companyDetailAddress: address.detailAddress
    }));
  }}
  placeholder="회사 주소를 검색하세요"
  detailAddressPlaceholder="사무실 번호 또는 층수"
/>
```

## 지도 연동 예시

### 1. 주소 선택 시 지도 마커 표시

```tsx
import { addressToMarkerData, geocodeAddress } from '../utils/addressUtils';

const handleAddressSelect = async (address: Address) => {
  // 지도 마커 데이터 생성
  const markerData = addressToMarkerData(address);
  
  // 지도에 마커 추가
  addMarkerToMap(markerData);
  
  // 좌표 정보가 없는 경우 지오코딩 수행
  if (!address.latitude || !address.longitude) {
    const coordinates = await geocodeAddress(address);
    if (coordinates) {
      // 지도 중심 이동
      moveMapToLocation(coordinates.latitude, coordinates.longitude);
    }
  }
};
```

### 2. 주소 히스토리 활용

```tsx
import { AddressHistory } from '../utils/addressUtils';

// 주소 선택 시 히스토리에 추가
const handleAddressSelect = (address: Address) => {
  AddressHistory.addToHistory(address);
  // 기타 처리...
};

// 히스토리에서 주소 목록 가져오기
const recentAddresses = AddressHistory.getHistory();
```

### 3. 주소 검증

```tsx
import { validateAddress } from '../utils/addressUtils';

const handleSubmit = () => {
  const validation = validateAddress(formData.address);
  if (!validation.isValid) {
    alert(validation.message);
    return;
  }
  // 폼 제출 처리...
};
```

## API 엔드포인트

### 주소 검색
```
GET /api/geocode?query=<검색어>
```

**응답 예시:**
```json
{
  "results": {
    "common": {
      "errorCode": "0",
      "errorMessage": "정상",
      "totalCount": "10"
    },
    "juso": [
      {
        "roadAddr": "서울특별시 강남구 테헤란로 427",
        "jibunAddr": "서울특별시 강남구 역삼동 737-32",
        "zipNo": "06123",
        "bdNm": "강남파이낸스센터",
        "engAddr": "427 Teheran-ro, Gangnam-gu, Seoul"
      }
    ]
  }
}
```

### 지오코딩 (향후 구현)
```
GET /api/geocode/coordinates?address=<주소>
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "latitude": 37.5665,
    "longitude": 126.9780,
    "formattedAddress": "서울특별시 강남구 테헤란로 427",
    "confidence": 0.8
  }
}
```

## 사용자 경험 개선

### 1. 상세주소 입력 가이드

```tsx
// 상세주소 입력 예시 제공
<AddressSearch
  detailAddressPlaceholder="예: 101동 304호, 3층 301호, A동 2층"
/>
```

### 2. 주소 미리보기

선택된 주소와 상세주소가 실시간으로 미리보기되어 사용자가 최종 주소를 확인할 수 있습니다.

### 3. 주소 확인 버튼

상세주소 입력 후 "주소 확인" 버튼을 클릭하여 최종 주소를 확정합니다.

## 향후 확장 계획

### 1. 지도 연동
- [ ] Naver Maps API 연동
- [ ] Google Maps API 연동
- [ ] Kakao Maps API 연동
- [ ] 실시간 좌표 변환

### 2. 고급 기능
- [ ] 주소 즐겨찾기
- [ ] 최근 검색어 자동완성
- [ ] 주소 검색 필터 (시/도, 구/군)
- [ ] 다국어 지원
- [ ] 상세주소 자동완성 (아파트명 기반)

### 3. 성능 최적화
- [ ] 검색 결과 캐싱
- [ ] 가상 스크롤링
- [ ] 이미지 지연 로딩

### 4. 접근성 개선
- [ ] 키보드 네비게이션
- [ ] 스크린 리더 지원
- [ ] 고대비 모드 지원

## 트러블슈팅

### 1. API 응답이 없는 경우
- 검색어가 3글자 미만인지 확인
- 특수문자나 SQL 예약어가 포함되어 있는지 확인
- 네트워크 연결 상태 확인

### 2. 서버 연결 오류
- `http://localhost:4000` 서버가 실행 중인지 확인
- 방화벽 설정 확인
- CORS 설정 확인

### 3. 지도 연동 오류
- 지도 API 키가 유효한지 확인
- 좌표 변환 API 호출 제한 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 4. 상세주소 관련 문제
- 상세주소 필드가 표시되지 않는 경우 `showDetailAddress={true}` 확인
- 상세주소 입력 후 주소가 업데이트되지 않는 경우 "주소 확인" 버튼 클릭 확인

## 개발 환경 설정

### 1. 서버 실행
```bash
node server.js
```

### 2. 환경 변수 설정
```bash
# .env 파일
PUBLIC_DATA_API_KEY=your_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
NAVER_MAPS_CLIENT_ID=your_naver_client_id_here
```

### 3. 의존성 설치
```bash
npm install axios cors express
```

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
