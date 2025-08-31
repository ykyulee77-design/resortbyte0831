# 네이버 지도 API 설정 가이드

## 📋 **필요한 API 키**

### 1. 네이버 클라우드 플랫폼에서 API 키 발급

#### **1단계: 네이버 클라우드 플랫폼 가입**
1. [네이버 클라우드 플랫폼](https://www.ncloud.com/) 접속
2. 네이버 계정으로 로그인
3. 무료 체험 신청 (신용카드 정보 필요)

#### **2단계: 애플리케이션 등록**
1. **AI·NAVER API** → **Maps** → **Maps** 선택
2. **Application 등록** 클릭
3. 애플리케이션 정보 입력:
   - **애플리케이션 이름**: ResortByte
   - **서비스 환경**: Web 서비스
   - **비즈니스 환경**: 일반
   - **웹 서비스 URL**: `http://localhost:3000` (개발용)
   - **웹 서비스 URL**: `https://your-domain.com` (배포용)

#### **3단계: API 키 확인**
1. 등록된 애플리케이션 클릭
2. **인증 정보** 탭에서 다음 정보 확인:
   - **Client ID**: `REACT_APP_NAVER_CLIENT_ID`에 사용
   - **Client Secret**: `REACT_APP_NAVER_CLIENT_SECRET`에 사용

### 2. .env 파일 설정

```bash
# .env 파일에 다음 내용 추가
REACT_APP_NAVER_CLIENT_ID=your_actual_client_id_here
REACT_APP_NAVER_CLIENT_SECRET=your_actual_client_secret_here
```

### 3. 프로덕션 환경 설정

배포 시에는 웹 서비스 URL을 실제 도메인으로 변경해야 합니다:

1. 네이버 클라우드 플랫폼에서 애플리케이션 설정 수정
2. **웹 서비스 URL**을 실제 배포 도메인으로 변경
3. 예: `https://resortbyte.web.app` (Firebase Hosting 사용 시)

## 🔧 **설정 확인 방법**

### 1. 개발 환경에서 테스트
```bash
npm start
```
브라우저에서 `http://localhost:3000/employer-dashboard` 접속하여 지도가 정상적으로 로드되는지 확인

### 2. 콘솔 오류 확인
브라우저 개발자 도구에서 다음 오류가 없는지 확인:
- "네이버 지도 API가 로드되지 않았습니다"
- "REACT_APP_NAVER_CLIENT_ID가 설정되지 않았습니다"

## ⚠️ **주의사항**

1. **API 키 보안**: .env 파일은 절대 Git에 커밋하지 마세요
2. **도메인 제한**: 네이버 지도 API는 등록된 도메인에서만 작동합니다
3. **사용량 제한**: 무료 플랜의 경우 월 사용량 제한이 있습니다

## 🚀 **다음 단계**

API 키 설정 완료 후:
1. 개발 환경에서 지도 기능 테스트
2. 프로덕션 빌드 테스트
3. 서버 배포 진행
