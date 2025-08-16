# Firebase Storage CORS 오류 해결 가이드

## 문제 상황
Firebase Storage에서 이미지 업로드 시 CORS 오류가 발생하는 경우가 있습니다.

## 해결 방법

### 1. Firebase Console에서 Storage Rules 확인

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **Storage** 클릭
4. **Rules** 탭 클릭
5. 다음 규칙 중 하나를 사용:

#### 방법 1: 인증된 사용자만 접근 (권장)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /accommodation-images/{fileName} {
      allow read, write: if request.auth != null;
    }
    
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### 방법 2: 임시로 모든 접근 허용 (개발용)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

6. **게시** 버튼 클릭

### 2. Firebase CLI로 CORS 설정 (선택사항)

#### 2-1. Firebase CLI 설치 및 로그인
```bash
npm install -g firebase-tools
firebase login
```

#### 2-2. CORS 설정 파일 생성
`firebase-storage-cors.json` 파일이 이미 생성되어 있습니다.

#### 2-3. CORS 설정 적용
```bash
gsutil cors set firebase-storage-cors.json gs://[YOUR-BUCKET-NAME]
```

버킷 이름 확인 방법:
1. Firebase Console > Storage
2. URL에서 버킷 이름 확인: `https://console.firebase.google.com/project/[PROJECT-ID]/storage/[BUCKET-NAME]`

### 3. 추가 디버깅 방법

#### 3-1. 브라우저 개발자 도구 확인
1. F12 키를 눌러 개발자 도구 열기
2. **Console** 탭에서 오류 메시지 확인
3. **Network** 탭에서 요청/응답 확인

#### 3-2. Firebase Storage 규칙 테스트
Firebase Console > Storage > Rules에서 **Rules Playground** 사용

### 4. 일반적인 문제 해결

#### 4-1. 인증 문제
- 사용자가 로그인되어 있는지 확인
- Firebase Auth 설정 확인

#### 4-2. 파일 크기 제한
- 현재 5MB로 제한되어 있음
- 필요시 제한을 늘릴 수 있음

#### 4-3. 파일 타입 제한
- 이미지 파일만 허용 (image/*)
- 필요시 다른 타입 추가 가능

### 5. 임시 해결책

CORS 문제가 지속되는 경우:

1. **Firebase Storage Rules를 임시로 완전 개방**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

2. **프로덕션 환경에서는 반드시 보안 규칙 적용**

### 6. 프로덕션 환경 고려사항

- 인증된 사용자만 접근하도록 규칙 설정
- 파일 크기 및 타입 제한 유지
- 정기적인 보안 감사 수행

## 문의 및 지원

문제가 지속되는 경우:
1. Firebase Console의 로그 확인
2. 브라우저 개발자 도구의 오류 메시지 확인
3. Firebase 지원팀에 문의 