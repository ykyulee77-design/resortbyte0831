# 🔥 Firebase Storage 설정 확인 및 문제 해결

## 1. Firebase Console에서 Storage Rules 확인

### 현재 규칙 확인
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택 (resortbyte)
3. 왼쪽 메뉴에서 **"Storage"** 클릭
4. **"Rules"** 탭 클릭

### 임시 완전 개방 규칙 적용 (문제 해결용)
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

## 2. 브라우저 개발자 도구에서 오류 확인

### 콘솔 오류 확인
1. 브라우저에서 F12 키 누르기
2. **Console** 탭 클릭
3. 이미지 업로드 시도
4. 오류 메시지 확인

### 네트워크 탭 확인
1. **Network** 탭 클릭
2. 이미지 업로드 시도
3. Firebase Storage 요청 확인

## 3. 일반적인 오류 및 해결 방법

### 오류: "storage/unauthorized"
- **원인**: Firebase Storage Rules 문제
- **해결**: 위의 완전 개방 규칙 적용

### 오류: "storage/retry-limit-exceeded"
- **원인**: 네트워크 문제 또는 파일 크기 문제
- **해결**: 
  - 파일 크기를 1MB 이하로 줄이기
  - 인터넷 연결 확인
  - 잠시 후 재시도

### 오류: "storage/bucket-not-found"
- **원인**: Firebase Storage 버킷 설정 문제
- **해결**: Firebase Console에서 Storage 활성화

## 4. Firebase Storage 활성화 확인

### Storage 활성화 방법
1. Firebase Console에서 **"Storage"** 클릭
2. **"시작하기"** 버튼 클릭
3. 보안 규칙 선택 (테스트 모드)
4. **"완료"** 클릭

## 5. 테스트 방법

### 단계별 테스트
1. Firebase Storage Rules를 완전 개방으로 설정
2. 브라우저 새로고침
3. 기숙사 정보 모달 열기
4. 이미지 업로드 시도
5. 콘솔에서 오류 메시지 확인

### 성공 시 확인 사항
- 이미지가 Firebase Storage에 업로드됨
- 다운로드 URL이 생성됨
- 이미지 미리보기가 표시됨

## 6. 문제가 지속되는 경우

### 추가 확인 사항
1. Firebase 프로젝트 설정 확인
2. API 키 및 도메인 설정 확인
3. 네트워크 연결 상태 확인
4. 브라우저 캐시 삭제

### 디버깅 정보 수집
- 브라우저 콘솔 오류 메시지
- 네트워크 탭의 요청/응답
- Firebase Console의 사용량 통계 