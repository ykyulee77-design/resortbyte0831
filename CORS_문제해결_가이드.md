# 🔥 CORS 문제 해결 가이드

## 🚨 현재 문제
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/v0/b/resortbyte.appspot.com/o?name=...' from origin 'http://localhost:3003' has been blocked by CORS policy
```

## ✅ 해결 방법 1: Firebase Console에서 CORS 설정

### 1단계: Google Cloud Console 접속
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택: **resortbyte**
3. 왼쪽 메뉴에서 **"Cloud Storage"** 클릭
4. **"Browser"** 클릭

### 2단계: CORS 설정
1. **"Settings"** 탭 클릭
2. **"CORS configuration"** 섹션 찾기
3. **"Edit"** 버튼 클릭
4. 아래 JSON을 붙여넣기:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable", "x-goog-meta-*"]
  }
]
```

5. **"Save"** 버튼 클릭

## ✅ 해결 방법 2: Firebase Storage Rules 완전 개방 (임시)

### 1단계: Firebase Console 접속
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택: **resortbyte**
3. 왼쪽 메뉴에서 **"Storage"** 클릭
4. **"Rules"** 탭 클릭

### 2단계: 규칙 변경
아래 규칙을 복사해서 붙여넣기:

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

3. **"게시"** 버튼 클릭

## ✅ 해결 방법 3: 브라우저 확장 프로그램 사용 (개발용)

### Chrome 확장 프로그램 설치
1. [CORS Unblock](https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino) 설치
2. 확장 프로그램 활성화
3. 이미지 업로드 테스트

## 🔄 적용 후 테스트

1. **브라우저 새로고침** (F5)
2. **개발자 도구 열기** (F12)
3. **Console 탭 클릭**
4. **기숙사 정보 모달 열기**
5. **이미지 업로드 시도**

## 📊 성공 확인

업로드가 성공하면:
- Firebase Console > Storage > Files에서 업로드된 이미지 확인
- 콘솔에 "✅ 파일 업로드 성공!" 메시지 표시

## ⚠️ 주의사항

### 방법 1 (CORS 설정) - 권장
- 가장 안전하고 올바른 방법
- 운영 환경에서도 사용 가능

### 방법 2 (완전 개방) - 임시용
- 개발/테스트용으로만 사용
- 보안상 위험하므로 테스트 후 반드시 보안 규칙으로 변경

### 방법 3 (브라우저 확장) - 개발용
- 개발 중에만 사용
- 운영 환경에서는 사용하지 않음

## 🚨 문제가 계속되면

1. **브라우저 캐시 삭제** (Ctrl+Shift+Delete)
2. **시크릿 모드**에서 테스트
3. **다른 브라우저**에서 테스트
4. **네트워크 연결** 확인

---

**가장 먼저 방법 1 (CORS 설정)을 시도해보세요!** 