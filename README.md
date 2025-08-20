# ResortBite - 리조트 채용 플랫폼

리조트바이트는 리조트 업계의 구인자와 구직자를 연결하는 채용 플랫폼입니다.

## 🚀 주요 기능

### 구인자 (Employer)
- 채용 공고 등록 및 관리
- 지원자 현황 확인
- 구인자 대시보드

### 구직자 (Jobseeker)
- 채용 공고 검색 및 필터링
- 일자리 지원
- 지원 현황 확인

### 관리자 (Admin)
- 전체 사용자 관리
- 채용 공고 관리
- 시스템 통계 확인

## 🛠️ 기술 스택

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **Icons**: Lucide React
- **Routing**: React Router

## 📦 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

## 🔐 계정 유형

### 구인자 (Employer)
- 회원가입 시 "구인자" 선택
- `/dashboard`로 접근

### 구직자 (Jobseeker)
- 회원가입 시 "구직자" 선택
- `/dashboard`로 접근

### 관리자 (Admin)
- 회원가입 시 "관리자" 선택
- `/admin`으로 접근

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
├── contexts/           # React Context (인증 등)
├── pages/             # 페이지 컴포넌트
├── types/             # TypeScript 타입 정의
├── firebase.ts        # Firebase 설정
└── App.tsx           # 메인 앱 컴포넌트
```

## 🔧 환경 설정

### Firebase 설정
Firebase 프로젝트 설정이 필요합니다:
1. Firebase Console에서 프로젝트 생성
2. Authentication 활성화 (이메일/비밀번호)
3. Firestore Database 생성
4. 웹앱 등록 및 설정 복사

### 주소 검색 API 설정
실제 주소 검색 기능을 사용하려면 공공데이터 포털의 도로명주소 API 키가 필요합니다:

1. [공공데이터 포털](https://www.data.go.kr/data/15000661/openapi.do)에서 도로명주소 API 신청
2. API 키 발급받기
3. 프로젝트 루트에 `.env` 파일 생성하고 다음 내용 추가:

```env
# Firebase 설정
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your_app_id_here

# 주소 검색 API 키
REACT_APP_JUSO_API_KEY=your_juso_api_key_here

# 개발 환경에서는 'dev'로 설정하면 샘플 데이터를 사용합니다
# REACT_APP_JUSO_API_KEY=dev
```

**참고**: API 키가 설정되지 않으면 샘플 주소 데이터를 사용합니다.

## 📝 라이센스

MIT License 