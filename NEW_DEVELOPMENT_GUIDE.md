# 새 기능 개발 가이드

## 🚀 새 기능 개발 프로세스

### 1단계: 새 기능 브랜치 생성
```bash
# develop 브랜치에서 시작
git checkout develop
git pull origin develop  # 최신 변경사항 가져오기
git checkout -b feature/새기능명
```

### 2단계: 로컬에서 개발
```bash
npm start  # http://localhost:3000에서 개발
# 또는 개발 채널에 배포해서 테스트
npm run build
firebase hosting:channel:deploy feature-새기능명 --expires 7d
```

### 3단계: 기능 완성 후 develop에 병합
```bash
git add .
git commit -m "feat: 새 기능 추가"
git checkout develop
git merge feature/새기능명
git push origin develop
```

### 4단계: develop 채널에 배포 (팀 검토용)
```bash
npm run build
firebase hosting:channel:deploy develop --expires 30d
# URL: https://resortbyte--develop-xxxxx.web.app
```

### 5단계: Production 배포 (최종 검증 후)
```bash
git checkout main
git merge develop
npm run build
firebase deploy --only hosting
```

## 🔄 개발 환경별 URL

### 로컬 개발
- URL: `http://localhost:3000`
- 명령어: `npm start`

### 개발 채널 (테스트용)
- URL: `https://resortbyte--develop-6bic06nx.web.app`
- 명령어: `firebase hosting:channel:deploy develop --expires 30d`

### 기능별 채널 (개별 테스트)
- URL: `https://resortbyte--feature-기능명-xxxxx.web.app`
- 명령어: `firebase hosting:channel:deploy feature-기능명 --expires 7d`

### Production (운영)
- URL: `https://resortbyte.web.app`
- 명령어: `firebase deploy --only hosting`

## 📋 개발 시 체크리스트

### 새 기능 개발 전
- [ ] develop 브랜치가 최신인지 확인
- [ ] 새 feature 브랜치 생성
- [ ] 로컬에서 `npm start`로 개발 환경 확인

### 개발 중
- [ ] 정기적으로 커밋 (`git add . && git commit -m "feat: 진행상황"`)
- [ ] 필요시 개발 채널에 배포해서 테스트
- [ ] 코드 리뷰 준비 (큰 변경사항의 경우)

### 개발 완료 후
- [ ] develop 브랜치에 병합
- [ ] develop 채널에 배포해서 팀 검토
- [ ] 최종 검증 후 main 브랜치에 병합
- [ ] Production 배포

## 🛠️ 유용한 명령어들

### 환경 전환
```bash
# Production 환경으로 전환
firebase use resortbyte
copy .env.production .env

# Development 환경으로 전환 (별도 프로젝트 사용 시)
firebase use resortbyte-dev
copy env.development .env
```

### 배포 명령어들
```bash
# 호스팅만 배포
firebase deploy --only hosting

# Functions만 배포
firebase deploy --only functions

# 전체 배포
firebase deploy

# 개발 채널 배포
firebase hosting:channel:deploy develop --expires 30d
```
