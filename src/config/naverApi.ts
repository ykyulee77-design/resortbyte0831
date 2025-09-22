/**
 * 네이버 API 설정 관리
 * 
 * 네이버는 여러 API 서비스를 제공하며, 각각 다른 Client ID를 사용합니다:
 * 1. 네이버 지도 API (Maps API) - 지도 표시용
 * 2. 네이버 로그인 API (Login API) - 소셜 로그인용
 * 
 * 각 API는 별도의 Client ID와 설정이 필요합니다.
 */

// 네이버 지도 API 설정
export const NAVER_MAPS_CONFIG = {
  // 지도 API 전용 Client ID
  CLIENT_ID: process.env.REACT_APP_NAVER_MAPS_CLIENT_ID || 'c4d9638auv',
  // 지도 API는 Secret이 필요하지 않음 (클라이언트 사이드에서만 사용)
  API_VERSION: 'v3',
  SUBMODULES: ['geocoder'], // 주소 검색 기능 포함
  LANGUAGE: 'ko', // 한국어 설정
} as const;

// 네이버 로그인 API 설정
export const NAVER_LOGIN_CONFIG = {
  // 로그인 API 전용 Client ID (지도 API와 다름)
  CLIENT_ID: process.env.REACT_APP_NAVER_LOGIN_CLIENT_ID || 'R0oImlUQC6DqKKV_V5BR',
  // 로그인 API는 Secret이 필요함 (서버 사이드에서 사용)
  CLIENT_SECRET: process.env.REACT_APP_NAVER_LOGIN_CLIENT_SECRET || 'bn75KcSeew8y60QMs1q9sRROugdhqtfnXv4kvir1',
  // 로그인 시 요청할 정보 범위
  SCOPE: 'name,email,mobile',
  // 콜백 URL
  REDIRECT_URI: `${window.location.origin}/auth/naver/callback`,
} as const;

// API 타입 정의
export type NaverMapsClientId = typeof NAVER_MAPS_CONFIG.CLIENT_ID;
export type NaverLoginClientId = typeof NAVER_LOGIN_CONFIG.CLIENT_ID;

// 환경 변수 검증 함수
export const validateNaverApiConfig = () => {
  const errors: string[] = [];

  // 지도 API 검증
  if (!NAVER_MAPS_CONFIG.CLIENT_ID || NAVER_MAPS_CONFIG.CLIENT_ID === 'your_maps_client_id') {
    errors.push('네이버 지도 API Client ID가 설정되지 않았습니다.');
  }

  // 로그인 API 검증
  if (!NAVER_LOGIN_CONFIG.CLIENT_ID || NAVER_LOGIN_CONFIG.CLIENT_ID === 'your_login_client_id') {
    errors.push('네이버 로그인 API Client ID가 설정되지 않았습니다.');
  }

  if (!NAVER_LOGIN_CONFIG.CLIENT_SECRET || NAVER_LOGIN_CONFIG.CLIENT_SECRET === 'your_login_client_secret') {
    errors.push('네이버 로그인 API Client Secret이 설정되지 않았습니다.');
  }

  if (errors.length > 0) {
    console.error('🚨 네이버 API 설정 오류:', errors);
    return false;
  }

  console.log('✅ 네이버 API 설정 검증 완료');
  console.log('🗺️ 지도 API Client ID:', NAVER_MAPS_CONFIG.CLIENT_ID);
  console.log('🔐 로그인 API Client ID:', NAVER_LOGIN_CONFIG.CLIENT_ID);
  
  return true;
};

// API 사용 가이드
export const NAVER_API_GUIDE = {
  MAPS: {
    PURPOSE: '지도 표시, 주소 검색, 좌표 변환',
    CLIENT_ID: '네이버 클라우드 플랫폼 > Application > Maps API',
    SECRET: '필요 없음 (클라이언트 사이드 전용)',
    USAGE: 'NaverMap, AddressSearch 컴포넌트에서 사용',
  },
  LOGIN: {
    PURPOSE: '소셜 로그인, 사용자 정보 획득',
    CLIENT_ID: '네이버 개발자센터 > Application > 로그인 API',
    SECRET: '필요함 (서버 사이드 인증용)',
    USAGE: 'NaverLogin 컴포넌트에서 사용',
  },
} as const;
