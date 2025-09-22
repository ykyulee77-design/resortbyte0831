# 네이버 API 관리 가이드

## 📋 개요

이 프로젝트에서는 네이버의 두 가지 주요 API를 사용합니다:

1. **네이버 지도 API** - 지도 표시 및 주소 검색
2. **네이버 로그인 API** - 소셜 로그인

각 API는 서로 다른 용도와 설정을 가지므로 명확하게 구분하여 관리합니다.

## 🗺️ 네이버 지도 API

### 용도
- 지도 표시 (`NaverMap` 컴포넌트)
- 주소 검색 (`AddressSearch` 컴포넌트)
- 좌표 변환 및 지오코딩

### 설정 위치
- **환경 변수**: `REACT_APP_NAVER_MAPS_CLIENT_ID`
- **설정 파일**: `src/config/naverApi.ts` → `NAVER_MAPS_CONFIG`
- **사용 컴포넌트**: `src/components/NaverMapScript.tsx`

### Client ID 획득 방법
1. [네이버 클라우드 플랫폼](https://www.ncloud.com/) 접속
2. Application > Maps API 선택
3. Client ID 생성

### 특징
- **Secret 불필요**: 클라이언트 사이드에서만 사용
- **브라우저 제한**: 도메인 등록 필요
- **사용량 제한**: 일일 호출 횟수 제한

## 🔐 네이버 로그인 API

### 용도
- 소셜 로그인 (`NaverLogin` 컴포넌트)
- 사용자 정보 획득 (이름, 이메일, 휴대폰번호)

### 설정 위치
- **환경 변수**: 
  - `REACT_APP_NAVER_LOGIN_CLIENT_ID`
  - `REACT_APP_NAVER_LOGIN_CLIENT_SECRET`
- **설정 파일**: `src/config/naverApi.ts` → `NAVER_LOGIN_CONFIG`
- **사용 컴포넌트**: `src/components/NaverLogin.tsx`

### Client ID/Secret 획득 방법
1. [네이버 개발자센터](https://developers.naver.com/) 접속
2. Application > 로그인 API 선택
3. Client ID와 Client Secret 생성

### 특징
- **Secret 필요**: 서버 사이드 인증에 사용
- **콜백 URL**: 반드시 등록된 도메인 사용
- **스코프 설정**: 요청할 사용자 정보 범위 지정

## 🔧 설정 방법

### 1. 환경 변수 설정

```bash
# env.development 파일에 추가
REACT_APP_NAVER_MAPS_CLIENT_ID=your_maps_client_id
REACT_APP_NAVER_LOGIN_CLIENT_ID=your_login_client_id
REACT_APP_NAVER_LOGIN_CLIENT_SECRET=your_login_client_secret
```

### 2. 설정 검증

```typescript
import { validateNaverApiConfig } from '../config/naverApi';

// 앱 시작 시 호출하여 설정 검증
validateNaverApiConfig();
```

## 📁 파일 구조

```
src/
├── config/
│   └── naverApi.ts          # 네이버 API 설정 관리
├── components/
│   ├── NaverMapScript.tsx   # 지도 API 스크립트 로드
│   ├── NaverMap.tsx         # 지도 컴포넌트
│   ├── NaverLogin.tsx       # 로그인 컴포넌트
│   └── AddressSearch.tsx    # 주소 검색 컴포넌트
└── docs/
    └── NAVER_API_GUIDE.md   # 이 가이드 파일
```

## ⚠️ 주의사항

### 1. API 키 혼동 방지
- 지도 API와 로그인 API는 **서로 다른 Client ID**를 사용합니다
- 각각 별도의 네이버 서비스에서 발급받아야 합니다

### 2. 보안 고려사항
- **지도 API**: Client ID만 필요 (클라이언트 노출 가능)
- **로그인 API**: Client Secret은 서버에서만 사용 (클라이언트 노출 금지)

### 3. 도메인 등록
- 두 API 모두 사용할 도메인을 미리 등록해야 합니다
- `localhost`는 개발 환경에서 자동 허용됩니다

## 🚨 문제 해결

### 인증 오류 발생 시
1. Client ID가 올바른지 확인
2. 도메인이 등록되어 있는지 확인
3. API 사용량 한도를 초과하지 않았는지 확인

### 설정 검증
```typescript
// 콘솔에서 확인할 수 있는 로그
🗺️ 네이버 지도 API 설정 확인: { CLIENT_ID: "c4d9638auv", ... }
🔐 로그인 API Client ID: c4d9638auv
✅ 네이버 API 설정 검증 완료
```

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. [네이버 클라우드 플랫폼 문서](https://guide.ncloud-docs.com/docs/maps-overview)
2. [네이버 개발자센터 문서](https://developers.naver.com/docs/login/)
3. 프로젝트의 `src/config/naverApi.ts` 파일의 설정
