# 배포된 프로젝트 수정 가이드

## 🚨 긴급 수정이 필요한 경우 (Hotfix)

### 1단계: main 브랜치에서 직접 수정
```bash
# 현재 main 브랜치에 있음
git status  # 변경사항 확인
# 수정 작업 진행
```

### 2단계: 수정사항 커밋 및 배포
```bash
git add .
git commit -m "hotfix: 긴급 수정 내용 설명"
npm run build
firebase deploy --only hosting
```

### 3단계: develop 브랜치에도 반영 (선택사항)
```bash
git checkout develop
git merge main
git push origin develop
```

## 📝 일반적인 수정 (권장)

### 1단계: hotfix 브랜치 생성
```bash
git checkout main
git checkout -b hotfix/수정내용
# 수정 작업
```

### 2단계: 테스트 후 병합
```bash
git add .
git commit -m "hotfix: 수정 내용"
git checkout main
git merge hotfix/수정내용
npm run build
firebase deploy --only hosting
```

## ⚠️ 주의사항
- main 브랜치에서 직접 작업 시 실수로 다른 변경사항이 포함될 수 있음
- 가능하면 hotfix 브랜치를 사용하는 것이 안전함
- 배포 전에 로컬에서 `npm start`로 테스트 권장
