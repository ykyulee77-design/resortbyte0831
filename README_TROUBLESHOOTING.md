# 🚨 리조트바이트 문제 해결 가이드

## 📁 파일 구조

```
resortbyte/
├── TROUBLESHOOTING_GUIDE.md     # 상세 문제 해결 가이드
├── debug-helper.js             # 브라우저 디버깅 헬퍼
├── quick-fix.bat               # Windows 빠른 해결 스크립트
├── quick-fix.ps1               # PowerShell 빠른 해결 스크립트
└── README_TROUBLESHOOTING.md   # 이 파일
```

## 🚀 빠른 시작

### 1. Windows 사용자
```bash
# 빠른 해결 스크립트 실행
quick-fix.bat
```

### 2. PowerShell 사용자
```powershell
# PowerShell 스크립트 실행
.\quick-fix.ps1
```

### 3. 수동 해결
```bash
# 모든 Node.js 프로세스 종료
taskkill /f /im node.exe

# 서버 재시작
npm start
npm run start:addr
```

## 🔍 브라우저 디버깅

### 1. 디버깅 헬퍼 로드
```javascript
// 브라우저 콘솔에서 실행
// debug-helper.js 파일을 먼저 로드하세요
```

### 2. 전체 진단
```javascript
// 전체 진단 실행
window.debugAll();
```

### 3. 개별 진단
```javascript
// 지도 관련
window.debugMap.checkCoordinates();
window.debugMap.testGeocoding('제주특별자치도 서귀포시 중문관광로72번길 75');

// 소셜로그인 관련
window.debugAuth.checkURLParams();
window.debugAuth.checkFirebaseAuth();

// 서버 연결
window.debugServer.testAPI('/api/health');
window.debugServer.testGeocodingAPI('서울특별시 강남구 테헤란로 427');
```

## 📋 체크리스트

### 지도 문제 체크리스트
- [ ] 네이버 지도 API 로드 완료 확인
- [ ] 자동 지오코딩 로그 확인
- [ ] 서울 좌표 감지 로직 확인
- [ ] v2.addresses 구조 확인
- [ ] 지도 중심 업데이트 확인

### 소셜로그인 문제 체크리스트
- [ ] URL 파라미터 확인
- [ ] Firebase 연결 상태 확인
- [ ] 인증 상태 확인
- [ ] 에러 처리 확인

### 일반 문제 체크리스트
- [ ] 포트 상태 확인
- [ ] 프로세스 상태 확인
- [ ] 프록시 설정 확인
- [ ] 환경 변수 확인

## 🚨 자주 발생하는 문제

### 1. 지도가 서울로 고정되는 문제
**원인**: 자동 지오코딩이 실행되지 않음
**해결**: `window.debugMap.checkCoordinates()` 실행 후 로그 확인

### 2. 지오코딩 API 인증 실패
**원인**: 서버 API 인증 문제
**해결**: 클라이언트 사이드 지오코딩 사용 (이미 구현됨)

### 3. 소셜로그인 콜백 오류
**원인**: URL 파라미터 누락
**해결**: `window.debugAuth.checkURLParams()` 실행 후 확인

### 4. 서버 연결 실패
**원인**: 포트 충돌 또는 프로세스 문제
**해결**: `quick-fix.bat` 또는 `quick-fix.ps1` 실행

## 📞 문제 발생 시 확인 순서

1. **빠른 해결 스크립트 실행**
   ```bash
   quick-fix.bat
   ```

2. **브라우저 디버깅**
   ```javascript
   window.debugAll();
   ```

3. **상세 가이드 참조**
   - `TROUBLESHOOTING_GUIDE.md` 파일 확인

4. **로그 분석**
   - 브라우저 콘솔 로그 확인
   - 서버 로그 확인

## 🎯 성공 지표

### 지도 문제 해결 성공
```
✅ 네이버 지도 API 로드 완료
✅ 자동 지오코딩 성공
✅ v2.addresses에서 좌표 추출
✅ 지도 중심이 서울이 아님 (false)
```

### 소셜로그인 문제 해결 성공
```
✅ URL 파라미터 정상
✅ Firebase 연결 성공
✅ 인증 상태 정상
✅ 에러 없음
```

### 서버 연결 성공
```
✅ 포트 3005 LISTENING
✅ 포트 4000 LISTENING
✅ API 응답 정상
```

---

**이 가이드를 참고하여 문제를 체계적으로 해결하세요!** 🎯
