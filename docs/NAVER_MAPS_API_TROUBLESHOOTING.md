# 네이버 지도 API 문제 해결 가이드

## 🚨 현재 발생 중인 문제

### 오류 메시지
```
GET http://oapi.map.naver.com/v3/auth?ncpKeyId=c4d9638auv&url=http%3A%2F%2Flocalhost%3A3001%2Femployer-dashboard&time=1758504478344&callback=__naver_maps_callback__0 net::ERR_ABORTED 401 (Unauthorized)

NAVER Maps JavaScript API v3 잠시 후에 다시 요청해 주세요., * Error Code / Error Message: 500 / Internal Server Error (내부 서버 오류), * Client ID: c4d9638auv, * URI: http://localhost:3001/employer-dashboard
```

### 문제 원인
1. **401 Unauthorized**: Client ID가 올바르지 않거나 도메인이 등록되지 않음
2. **500 Internal Server Error**: 네이버 서버 측 오류 또는 API 설정 문제

## 🔧 해결 방법

### 1단계: 네이버 클라우드 플랫폼 확인

#### 1.1 Application 확인
1. [네이버 클라우드 플랫폼](https://www.ncloud.com/) 접속
2. **Application** → **Maps API** 선택
3. Client ID가 `c4d9638auv`인지 확인

#### 1.2 도메인 등록 확인
1. **도메인 등록** 섹션에서 다음 도메인들이 등록되어 있는지 확인:
   - `localhost:3001`
   - `127.0.0.1:3001`
   - `http://localhost:3001`
   - `http://127.0.0.1:3001`

#### 1.3 API 사용량 확인
1. **사용량** 탭에서 일일 호출 한도를 확인
2. 한도를 초과했다면 다음날까지 기다리거나 한도 증가 요청

### 2단계: Client ID 재확인

#### 2.1 올바른 Client ID 확인
```bash
# 현재 사용 중인 Client ID
REACT_APP_NAVER_MAPS_CLIENT_ID=c4d9638auv
```

#### 2.2 새로운 Client ID 생성 (필요 시)
1. 네이버 클라우드 플랫폼에서 **새 Application 생성**
2. **Maps API** 활성화
3. 새로운 Client ID 복사
4. `env.development` 파일 업데이트

### 3단계: 환경 변수 재설정

#### 3.1 환경 변수 파일 확인
```bash
# env.development
REACT_APP_NAVER_MAPS_CLIENT_ID=c4d9638auv
```

#### 3.2 개발 서버 재시작
```bash
# 기존 프로세스 종료
taskkill /f /im node.exe

# 새로 시작
npm start
```

### 4단계: 대안 해결책

#### 4.1 다른 Client ID 테스트
```bash
# 테스트용 Client ID (예시)
REACT_APP_NAVER_MAPS_CLIENT_ID=test_client_id
```

#### 4.2 HTTPS 사용
- 네이버 지도 API는 HTTPS에서 더 안정적으로 작동
- `https://localhost:3001`으로 접속 시도

#### 4.3 Fallback 모드 사용
- 현재 구현된 fallback UI가 작동 중
- 지도 대신 주소 정보만 표시

## 📋 체크리스트

### 네이버 클라우드 플랫폼 설정
- [ ] Application이 활성화되어 있음
- [ ] Maps API가 활성화되어 있음
- [ ] Client ID가 올바름 (`c4d9638auv`)
- [ ] 도메인이 등록되어 있음 (`localhost:3001`)
- [ ] API 사용량 한도 내에 있음

### 로컬 환경 설정
- [ ] 환경 변수가 올바르게 설정됨
- [ ] 개발 서버가 재시작됨
- [ ] 브라우저 캐시가 클리어됨

### 네트워크 확인
- [ ] 인터넷 연결이 안정적임
- [ ] 방화벽이 API 호출을 차단하지 않음
- [ ] 프록시 설정이 올바름

## 🔍 디버깅 방법

### 1. 콘솔 로그 확인
```javascript
// 네이버 지도 API 설정 확인
🗺️ 네이버 지도 API 설정 확인: {CLIENT_ID: 'c4d9638auv', ...}
✅ 네이버 API 설정 검증 완료
```

### 2. 네트워크 탭 확인
- 브라우저 개발자 도구 → Network 탭
- `oapi.map.naver.com` 요청 확인
- 응답 상태 코드 및 오류 메시지 확인

### 3. API 직접 테스트
```javascript
// 브라우저 콘솔에서 직접 테스트
fetch('https://oapi.map.naver.com/v3/auth?ncpKeyId=c4d9638auv&url=http://localhost:3001')
  .then(response => console.log(response.status))
  .catch(error => console.error(error));
```

## 📞 지원

### 네이버 클라우드 플랫폼 지원
- [네이버 클라우드 플랫폼 고객센터](https://www.ncloud.com/support)
- [Maps API 문서](https://guide.ncloud-docs.com/docs/maps-overview)

### 추가 도움이 필요한 경우
1. 네이버 클라우드 플랫폼에서 새 Application 생성
2. 다른 Client ID로 테스트
3. HTTPS 환경에서 테스트
4. 다른 브라우저에서 테스트

## 🎯 임시 해결책

현재 fallback 모드가 구현되어 있어 지도 API가 실패해도 앱은 정상 작동합니다:

1. **지도 대신 주소 정보 표시**
2. **사용자에게 명확한 오류 메시지 제공**
3. **새로고침 버튼으로 재시도 가능**
4. **앱의 다른 기능들은 정상 작동**

이 가이드를 따라 문제를 해결하거나, 임시로 fallback 모드를 사용하실 수 있습니다.
