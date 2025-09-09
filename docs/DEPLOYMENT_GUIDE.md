# 리조트바이트 배포 가이드

## Vercel 배포 절차

### 1. Vercel 로그인
```bash
vercel login
```
- GitHub, Google, 또는 GitLab 계정으로 로그인

### 2. 프로젝트 배포
```bash
vercel
```
- 프로젝트 이름: `resortbyte`
- 프레임워크: `Create React App`
- 루트 디렉토리: `./`

### 3. 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수들을 설정:

#### Firebase 설정
```
REACT_APP_FIREBASE_API_KEY=your_production_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_production_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_production_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_production_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_production_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_production_firebase_app_id
```

#### Naver Map API
```
REACT_APP_NAVER_CLIENT_ID=your_production_naver_client_id
```

#### 기타 설정
```
REACT_APP_ENV=production
REACT_APP_VERSION=1.0.0
```

### 4. 도메인 연결
1. Vercel 대시보드에서 프로젝트 선택
2. Settings > Domains
3. Custom Domain 추가
4. DNS 설정에서 CNAME 레코드 추가:
   ```
   Type: CNAME
   Name: @ (또는 www)
   Value: your-app.vercel.app
   ```

### 5. Firebase 프로덕션 설정

#### Firestore 보안 규칙
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 인증된 경우만 접근
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 공고는 인증된 사용자만 작성, 모든 사용자가 읽기 가능
    match /jobPosts/{jobId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // 관리자만 접근 가능
    match /admin/{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

#### Storage 보안 규칙
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 6. 배포 확인
- 배포 완료 후 제공되는 URL로 접속
- 모든 기능이 정상 작동하는지 확인
- 모바일 반응형 테스트
- 브라우저 호환성 테스트

### 7. 모니터링 설정
- Google Analytics 연결
- Vercel Analytics 활성화
- 에러 모니터링 설정

## 문제 해결

### 빌드 실패 시
1. 환경 변수 확인
2. 의존성 설치: `npm install`
3. 캐시 삭제: `npm run build -- --reset-cache`

### 도메인 연결 실패 시
1. DNS 설정 확인
2. SSL 인증서 발급 대기 (최대 24시간)
3. Vercel 지원팀 문의

### Firebase 연결 실패 시
1. Firebase 프로젝트 설정 확인
2. API 키 유효성 확인
3. CORS 설정 확인

## 성능 최적화

### 이미지 최적화
- WebP 형식 사용
- 적절한 이미지 크기 설정
- 지연 로딩 적용

### 코드 분할
- React.lazy 사용
- 동적 import 적용
- 번들 크기 최적화

### 캐싱 전략
- 정적 자산 캐싱
- API 응답 캐싱
- CDN 활용

## 보안 체크리스트

- [ ] 환경 변수 보안 설정
- [ ] Firebase 보안 규칙 적용
- [ ] CORS 설정 확인
- [ ] HTTPS 강제 적용
- [ ] 사용자 인증 강화
- [ ] 데이터 검증 구현
- [ ] 에러 처리 개선
- [ ] 로깅 시스템 구축
