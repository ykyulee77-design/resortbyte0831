# 🏖️ ResortBite - Resort Job Platform

리조트 구인구직 플랫폼으로, 구직자와 구인자를 연결하는 현대적인 웹 애플리케이션입니다.

## ✨ 주요 기능

### 🎯 핵심 기능
- **구인구직 매칭**: 리조트 업계 특화 구인구직 서비스
- **실시간 채팅**: 구인자와 구직자 간 실시간 소통
- **지도 기반 검색**: 네이버 지도 API를 활용한 위치 기반 검색
- **이미지 업로드**: 기숙사 및 시설 사진 업로드 기능
- **리뷰 시스템**: 구직자 후기 및 평점 시스템

### 👥 사용자 관리
- **회원가입/로그인**: Firebase Authentication 기반
- **프로필 관리**: 개인정보 및 경력 관리
- **권한 관리**: 구직자/구인자 역할 구분

### 📝 공고 관리
- **공고 등록**: 구인자가 채용 공고 등록
- **공고 검색**: 필터링 및 정렬 기능
- **지원 관리**: 구직자의 지원서 관리

### 🔧 관리자 시스템
- **관리자 대시보드**: 실시간 통계 및 모니터링
- **사용자 관리**: 회원 승인/정지/삭제
- **공고 관리**: 공고 승인/수정/삭제
- **시스템 모니터링**: 성능 및 오류 모니터링

## 🛠️ 기술 스택

### Frontend
- **React 18** - 사용자 인터페이스
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 스타일링
- **React Router** - 라우팅
- **Lucide React** - 아이콘

### Backend
- **Firebase** - 인증, 데이터베이스, 스토리지
- **Express.js** - API 서버
- **Node.js** - 서버 런타임

### Database
- **Firestore** - NoSQL 데이터베이스
- **Firebase Storage** - 파일 저장소

### External APIs
- **Naver Maps API** - 지도 서비스
- **Geocoding API** - 주소 검색

## 🚀 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/yourusername/resortbyte.git
cd resortbyte
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 추가:
```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
REACT_APP_NAVER_CLIENT_ID=your_naver_client_id
REACT_APP_NAVER_CLIENT_SECRET=your_naver_client_secret
```

### 4. 개발 서버 실행
```bash
# 개발 모드 (React + Express 서버)
npm run dev:env

# 또는 개별 실행
npm run server  # Express 서버 (포트 4000)
npm start       # React 개발 서버 (포트 3000)
```

### 5. 프로덕션 빌드
```bash
npm run build
```

## 📁 프로젝트 구조

```
resortbyte/
├── public/                 # 정적 파일
├── src/
│   ├── components/         # 재사용 가능한 컴포넌트
│   ├── pages/             # 페이지 컴포넌트
│   ├── contexts/          # React Context
│   ├── types/             # TypeScript 타입 정의
│   ├── utils/             # 유틸리티 함수
│   └── firebase.ts        # Firebase 설정
├── docs/                  # 문서
├── deployment/            # 배포 관련 문서
└── server.js              # Express 서버
```

## 🔧 주요 설정 파일

- `firebase.json` - Firebase 설정
- `firestore.rules` - Firestore 보안 규칙
- `firestore.indexes.json` - Firestore 인덱스
- `tailwind.config.js` - Tailwind CSS 설정
- `tsconfig.json` - TypeScript 설정

## 📊 성능 최적화

### 현재 구현된 최적화
- **이미지 최적화**: WebP 형식 지원, 압축
- **페이지네이션**: 대용량 데이터 처리
- **캐싱 시스템**: 메모리 기반 캐싱
- **CDN 지원**: 이미지 CDN 최적화
- **코드 스플리팅**: React.lazy 활용

### 확장 계획
- **마이크로서비스**: 서비스 분리
- **로드 밸런싱**: 트래픽 분산
- **데이터베이스 샤딩**: 대용량 데이터 처리
- **Redis 캐싱**: 분산 캐싱

## 🔒 보안

- **Firebase Authentication**: 안전한 인증
- **Firestore 보안 규칙**: 데이터 접근 제어
- **CORS 설정**: API 보안
- **Rate Limiting**: 요청 제한
- **HTTPS 강제**: 보안 통신

## 📈 모니터링

- **성능 모니터링**: 응답 시간, 오류율
- **사용자 활동 추적**: 페이지 방문, 기능 사용
- **시스템 리소스**: CPU, 메모리, 네트워크
- **오류 로깅**: 자동 오류 수집

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

- **프로젝트 링크**: [https://github.com/yourusername/resortbyte](https://github.com/yourusername/resortbyte)
- **이슈 리포트**: [https://github.com/yourusername/resortbyte/issues](https://github.com/yourusername/resortbyte/issues)

## 🙏 감사의 말

- [Firebase](https://firebase.google.com/) - 백엔드 서비스
- [React](https://reactjs.org/) - 프론트엔드 프레임워크
- [Tailwind CSS](https://tailwindcss.com/) - CSS 프레임워크
- [Naver Maps API](https://developers.naver.com/main/) - 지도 서비스

---

⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요! 