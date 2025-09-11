# 개발 워크플로우 가이드

## 1. 환경 분리 전략

### 현재 상황
- **Production**: `https://resortbyte.web.app` (main 브랜치)
- **Development**: `https://resortbyte--develop-6bic06nx.web.app` (develop 브랜치)
- **Local**: `http://localhost:3000` (로컬 개발)

## 2. 새 기능 개발 과정

### Step 1: 기능 브랜치 생성
```bash
git checkout develop
git pull origin develop
git checkout -b feature/새기능명
```

### Step 2: 개발 환경에서 작업
```bash
# 로컬에서 개발
npm start

# 또는 개발 채널에 배포
npm run build
firebase hosting:channel:deploy feature-새기능명 --expires 7d
```

### Step 3: 테스트 및 검토
- 로컬: `http://localhost:3000`
- 개발 채널: `https://resortbyte--feature-새기능명-xxxxx.web.app`

### Step 4: develop 브랜치에 병합
```bash
git checkout develop
git merge feature/새기능명
git push origin develop
```

### Step 5: develop 채널에 배포
```bash
npm run build
firebase hosting:channel:deploy develop --expires 30d
```

### Step 6: Production 배포 (검증 후)
```bash
git checkout main
git merge develop
npm run build
firebase deploy --only hosting
```

## 3. 환경별 설정

### Production (.env.production)
```
REACT_APP_API_URL=https://asia-northeast3-resortbyte.cloudfunctions.net/api
REACT_APP_NAVER_CLIENT_ID=c4d9638auv
REACT_APP_FUNCTIONS_REGION=asia-northeast3
REACT_APP_FIREBASE_PROJECT_ID=resortbyte
```

### Development (env.development)
```
REACT_APP_API_URL=https://asia-northeast3-resortbyte-dev.cloudfunctions.net/api
REACT_APP_NAVER_CLIENT_ID=c4d9638auv
REACT_APP_FUNCTIONS_REGION=asia-northeast3
REACT_APP_FIREBASE_PROJECT_ID=resortbyte-dev
```

## 4. 긴급 수정 (Hotfix)

### Production에서 긴급 수정이 필요한 경우
```bash
git checkout main
git checkout -b hotfix/긴급수정명
# 수정 작업
git add .
git commit -m "hotfix: 긴급 수정 내용"
git checkout main
git merge hotfix/긴급수정명
npm run build
firebase deploy --only hosting
```

## 5. 데이터베이스 관리

### Firestore 규칙
- Production: `firestore.rules`
- Development: 별도 개발 프로젝트 사용 권장

### Functions 배포
```bash
# Production
firebase deploy --only functions

# Development (별도 프로젝트)
firebase use resortbyte-dev
firebase deploy --only functions
```

## 6. 모니터링 및 로그

### Firebase Console
- Production: https://console.firebase.google.com/project/resortbyte
- Development: https://console.firebase.google.com/project/resortbyte-dev

### 로그 확인
```bash
firebase functions:log
```
