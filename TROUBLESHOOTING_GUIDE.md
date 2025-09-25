# 🚨 리조트바이트 문제 해결 가이드

## 📍 지도 관련 문제 해결

### 1. 지도가 서울로 고정되는 문제

#### 🔍 진단 방법
```javascript
// 브라우저 콘솔에서 확인
console.log('현재 좌표:', {
  lat: accommodationInfo.latitude,
  lng: accommodationInfo.longitude,
  isSeoul: accommodationInfo.latitude === 37.5665 && accommodationInfo.longitude === 126.9780
});
```

#### ✅ 해결 방법
1. **자동 지오코딩 로그 확인**
   ```
   자동 지오코딩 체크: { needsGeocode: true }
   네이버 클라이언트 지오코딩 사용
   v2.addresses에서 좌표 추출: { lat: 33.247393, lng: 126.40795 }
   ```

2. **서울 좌표 감지 로직**
   ```javascript
   // 서울 기본 좌표인지 확인 (37.5665, 126.9780)
   const isSeoulDefault = accommodationInfo?.latitude === 37.5665 && accommodationInfo?.longitude === 126.9780;
   
   // 더 넓은 범위로 서울 좌표 감지 (37.5~37.6, 126.9~127.0)
   const isSeoulRange = accommodationInfo?.latitude >= 37.5 && accommodationInfo?.latitude <= 37.6 && 
                        accommodationInfo?.longitude >= 126.9 && accommodationInfo?.longitude <= 127.0;
   ```

3. **네이버 지오코딩 API 응답 구조**
   ```javascript
   // v2.addresses 구조 확인
   if (response && response.v2 && response.v2.addresses) {
     const addresses = response.v2.addresses;
     if (addresses.length > 0) {
       const addr = addresses[0];
       const lat = parseFloat(addr.y);
       const lng = parseFloat(addr.x);
     }
   }
   ```

### 2. 지도가 로드되지 않는 문제

#### 🔍 진단 방법
```javascript
// 네이버 지도 API 로드 상태 확인
console.log('window.naver 상태:', window.naver);
console.log('window.naver.maps 상태:', window.naver.maps);
```

#### ✅ 해결 방법
1. **API 키 확인**
   ```javascript
   // naverApi.ts에서 확인
   console.log('지도 API Client ID:', c4d9638auv);
   ```

2. **스크립트 로드 확인**
   ```javascript
   // NaverMapScript.tsx에서 확인
   console.log('네이버 지도 API 스크립트 로드 완료');
   console.log('window.naver.maps 상태:', window.naver.maps);
   ```

### 3. 지오코딩 API 인증 실패

#### 🔍 진단 방법
```
❌ 네이버 지오코딩 오류: {
  error: {
    errorCode: '210',
    message: 'Permission Denied',
    details: 'A subscription to the API is required.'
  }
}
```

#### ✅ 해결 방법
1. **클라이언트 사이드 지오코딩 사용**
   ```javascript
   // 서버 API 대신 브라우저에서 직접 사용
   window.naver.maps.Service.geocode({
     query: address
   }, (status, response) => {
     // v2.addresses 구조 확인
     if (response && response.v2 && response.v2.addresses) {
       // 좌표 추출
     }
   });
   ```

## 🔐 소셜로그인 관련 문제 해결

### 1. 네이버 로그인 콜백 오류

#### 🔍 진단 방법
```javascript
// SimpleNaverCallback.tsx에서 확인
console.log('URL 파라미터:', window.location.search);
console.log('code 파라미터:', urlParams.get('code'));
console.log('state 파라미터:', urlParams.get('state'));
```

#### ✅ 해결 방법
1. **URL 파라미터 확인**
   ```javascript
   const urlParams = new URLSearchParams(window.location.search);
   const code = urlParams.get('code');
   const state = urlParams.get('state');
   
   if (!code) {
     console.error('인증 코드가 없습니다');
     return;
   }
   ```

2. **에러 처리**
   ```javascript
   try {
     // 로그인 처리
   } catch (error) {
     console.error('로그인 처리 중 오류:', error);
     // 에러 페이지로 리다이렉트
   }
   ```

### 2. Firebase Auth 연결 문제

#### 🔍 진단 방법
```javascript
// AuthContext.tsx에서 확인
console.log('Firebase 연결 상태:', firebase.apps.length > 0);
console.log('사용자 인증 상태:', user);
```

#### ✅ 해결 방법
1. **Firebase 설정 확인**
   ```javascript
   // firebase.ts에서 확인
   console.log('Firebase 프로젝트 ID:', projectId);
   console.log('Firebase Auth 도메인:', authDomain);
   ```

2. **인증 상태 확인**
   ```javascript
   // AuthContext.tsx에서 확인
   useEffect(() => {
     const unsubscribe = onAuthStateChanged(auth, (user) => {
       console.log('인증 상태 변경:', user);
     });
     return unsubscribe;
   }, []);
   ```

## 🔧 일반적인 문제 해결 순서

### 1. 연결 문제 해결
```bash
# 포트 확인
netstat -an | findstr "LISTENING" | findstr ":3005"
netstat -an | findstr "LISTENING" | findstr ":4000"

# 프로세스 종료
taskkill /f /im node.exe

# 서버 재시작
npm start
npm run start:addr
```

### 2. 프록시 설정 확인
```javascript
// setupProxy.js 확인
module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000',
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' },
      logLevel: 'silent',
    })
  );
};
```

### 3. 환경 변수 확인
```javascript
// .env 파일 확인
REACT_APP_NAVER_CLIENT_ID=c4d9638auv
REACT_APP_NAVER_CLIENT_SECRET=bn75KcSeew8y60QMs1q9sRROugdhqtfnXv4kvir1
REACT_APP_BACKEND_URL=http://localhost:4000
```

## 📝 체크리스트

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

## 🚀 빠른 해결 명령어

```bash
# 모든 Node.js 프로세스 종료
taskkill /f /im node.exe

# 서버 재시작
npm start
npm run start:addr

# 포트 확인
netstat -an | findstr "LISTENING" | findstr ":3005"
netstat -an | findstr "LISTENING" | findstr ":4000"
```

## 📞 문제 발생 시 확인 순서

1. **브라우저 콘솔 로그 확인**
2. **서버 로그 확인**
3. **포트 상태 확인**
4. **프로세스 상태 확인**
5. **환경 변수 확인**
6. **프록시 설정 확인**

---

**이 가이드를 참고하여 문제를 체계적으로 해결하세요!** 🎯
