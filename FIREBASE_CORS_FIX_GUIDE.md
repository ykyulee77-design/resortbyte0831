# Firebase Storage CORS 문제 해결 가이드

## 문제 상황
구인공고 등록 시 이미지 업로드에서 CORS 오류가 발생하고 있습니다.

## 임시 해결책 (이미 적용됨)
- 이미지 업로드 기능을 임시로 비활성화하여 구인공고 등록이 가능하도록 수정
- 이미지 없이도 공고 등록 가능

## 영구 해결책: Firebase Console에서 CORS 설정

### 1단계: Firebase Console 접속
1. https://console.firebase.google.com 접속
2. `resortbyte` 프로젝트 선택

### 2단계: Storage 설정
1. 왼쪽 메뉴에서 "Storage" 클릭
2. "Rules" 탭 클릭

### 3단계: CORS 설정 추가
Storage Rules에 다음 내용을 추가:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}

// CORS 설정 (Firebase Console에서 직접 설정 필요)
```

### 4단계: Google Cloud Console에서 CORS 설정
1. https://console.cloud.google.com 접속
2. `resortbyte` 프로젝트 선택
3. 왼쪽 메뉴에서 "Cloud Storage" > "Browser" 클릭
4. `resortbyte.appspot.com` 버킷 선택
5. "Permissions" 탭 클릭
6. "CORS" 섹션에서 다음 설정 추가:

```json
[
  {
    "origin": [
      "http://localhost:3000",
      "http://localhost:3001", 
      "http://localhost:3002",
      "http://localhost:3003",
      "http://localhost:3004",
      "http://localhost:3005",
      "https://resortbyte.web.app",
      "https://resortbyte.firebaseapp.com"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": [
      "Content-Type",
      "Authorization", 
      "Content-Length",
      "User-Agent",
      "x-goog-resumable",
      "x-goog-encryption-algorithm",
      "x-goog-meta-*"
    ]
  }
]
```

### 5단계: 이미지 업로드 기능 재활성화
CORS 설정 완료 후 `src/pages/JobPostForm.tsx`에서 주석 처리된 이미지 업로드 코드를 다시 활성화:

```typescript
const uploadImages = async (images: File[]): Promise<string[]> => {
  const uploadPromises = images.map(async (image) => {
    const storageRef = ref(storage, `job-posts/${Date.now()}_${image.name}`);
    const snapshot = await uploadBytes(storageRef, image);
    return getDownloadURL(snapshot.ref);
  });
  
  return Promise.all(uploadPromises);
};
```

## 대안 해결책: 환경별 CORS 설정

### 개발 환경
```json
{
  "origin": ["http://localhost:3000"],
  "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
  "maxAgeSeconds": 3600
}
```

### 프로덕션 환경
```json
{
  "origin": ["https://resortbyte.web.app", "https://resortbyte.firebaseapp.com"],
  "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
  "maxAgeSeconds": 3600
}
```

## 문제 해결 확인 방법
1. 구인공고 등록 페이지에서 이미지 업로드 테스트
2. 브라우저 개발자 도구에서 CORS 오류 확인
3. Firebase Storage에서 업로드된 이미지 확인

## 주의사항
- CORS 설정 변경 후 최대 1시간까지 캐시될 수 있음
- 프로덕션 배포 시 반드시 프로덕션 도메인을 CORS 설정에 포함
- 보안을 위해 필요한 도메인만 허용하도록 설정
