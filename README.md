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

Firebase 프로젝트 설정이 필요합니다:
1. Firebase Console에서 프로젝트 생성
2. Authentication 활성화 (이메일/비밀번호)
3. Firestore Database 생성
4. 웹앱 등록 및 설정 복사

## 📝 라이센스

MIT License 