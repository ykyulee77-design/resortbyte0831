# 🚀 ResortBite 배포 가이드

## 📋 배포 전 준비사항

### 1. 환경 변수 설정
`.env` 파일을 생성하고 Firebase 설정을 추가하세요:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 2. 프로덕션 빌드
```bash
npm run build
```

## 🌐 배포 방법

### 방법 1: Firebase Hosting (권장)

#### 1단계: Firebase CLI 설치
```bash
npm install -g firebase-tools
```

#### 2단계: Firebase 로그인
```bash
firebase login
```

#### 3단계: Firebase 프로젝트 초기화
```bash
firebase init hosting
```

#### 4단계: 설정 선택
- 프로젝트 선택: `resortbyte`
- Public directory: `build`
- Single-page app: `Yes`
- GitHub Actions: `No`

#### 5단계: 배포
```bash
npm run build
firebase deploy
```

### 방법 2: Vercel (무료)

#### 1단계: Vercel CLI 설치
```bash
npm install -g vercel
```

#### 2단계: 배포
```bash
vercel
```

#### 3단계: 환경 변수 설정
Vercel 대시보드에서 환경 변수를 설정하세요.

### 방법 3: Netlify (무료)

#### 1단계: Netlify CLI 설치
```bash
npm install -g netlify-cli
```

#### 2단계: 배포
```bash
npm run build
netlify deploy --prod --dir=build
```

### 방법 4: GitHub Pages

#### 1단계: package.json 수정
```json
{
  "homepage": "https://yourusername.github.io/resortbyte",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

#### 2단계: gh-pages 설치
```bash
npm install --save-dev gh-pages
```

#### 3단계: 배포
```bash
npm run deploy
```

## 🔧 배포 후 설정

### 1. Firebase Storage Rules 설정
Firebase Console에서 Storage Rules를 설정하세요:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /accommodation-images/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 2. 도메인 설정
- Firebase Hosting: `https://your-project.web.app`
- Vercel: `https://your-project.vercel.app`
- Netlify: `https://your-project.netlify.app`

### 3. SSL 인증서
모든 플랫폼에서 자동으로 SSL 인증서가 제공됩니다.

## 📱 PWA 설정

### 1. Service Worker 등록
`src/index.tsx`에 다음 코드를 추가하세요:

```typescript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
```

### 2. 오프라인 지원
`public/sw.js` 파일을 생성하여 오프라인 캐싱을 설정하세요.

## 🔍 배포 확인

### 1. 기능 테스트
- [ ] 로그인/회원가입
- [ ] 기숙사 정보 등록
- [ ] 이미지 업로드
- [ ] 구인구직 기능
- [ ] 채팅 기능

### 2. 성능 확인
- [ ] 페이지 로딩 속도
- [ ] 이미지 최적화
- [ ] 모바일 반응형

### 3. 보안 확인
- [ ] 환경 변수 노출 여부
- [ ] Firebase 보안 규칙
- [ ] HTTPS 연결

## 🛠️ 문제 해결

### 일반적인 문제들

#### 1. 빌드 오류
```bash
npm run build
```
오류 메시지를 확인하고 TypeScript 오류를 수정하세요.

#### 2. 환경 변수 문제
`.env` 파일이 올바르게 설정되었는지 확인하세요.

#### 3. Firebase 연결 문제
Firebase 프로젝트 설정을 확인하고 API 키가 올바른지 확인하세요.

#### 4. 이미지 업로드 문제
Firebase Storage Rules를 확인하고 CORS 설정을 확인하세요.

## 📞 지원

문제가 발생하면 다음 정보를 수집하여 문의하세요:
1. 배포 플랫폼
2. 오류 메시지
3. 브라우저 콘솔 로그
4. 네트워크 요청/응답 