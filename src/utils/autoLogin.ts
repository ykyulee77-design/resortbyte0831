// 자동 로그인 토큰 관리 유틸리티

interface AutoLoginToken {
  token: string;
  expires: number;
  userInfo: {
    uid: string;
    email: string;
    displayName: string;
    roles: string[];
    currentRole?: string;
    role?: string; // 기존 호환성을 위해 유지
    mobile?: string;
    photoURL?: string;
  };
}

const AUTO_LOGIN_KEY = 'resortbyte_auto_login';
const TOKEN_EXPIRY_DAYS = 7; // 7일 후 만료

/**
 * 자동 로그인 토큰 저장
 */
export const saveAutoLoginToken = (userInfo: AutoLoginToken['userInfo']): void => {
  try {
    const token = generateSecureToken();
    const expires = Date.now() + (TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    
    const autoLoginData: AutoLoginToken = {
      token,
      expires,
      userInfo
    };
    
    localStorage.setItem(AUTO_LOGIN_KEY, JSON.stringify(autoLoginData));
    console.log('자동 로그인 토큰 저장 완료:', { expires: new Date(expires) });
  } catch (error) {
    console.error('자동 로그인 토큰 저장 실패:', error);
  }
};

/**
 * 자동 로그인 토큰 가져오기
 */
export const getAutoLoginToken = (): AutoLoginToken | null => {
  try {
    const stored = localStorage.getItem(AUTO_LOGIN_KEY);
    if (!stored) return null;
    
    const autoLoginData: AutoLoginToken = JSON.parse(stored);
    
    // 토큰 만료 확인
    if (Date.now() > autoLoginData.expires) {
      console.log('자동 로그인 토큰 만료됨');
      removeAutoLoginToken();
      return null;
    }
    
    return autoLoginData;
  } catch (error) {
    console.error('자동 로그인 토큰 읽기 실패:', error);
    removeAutoLoginToken();
    return null;
  }
};

/**
 * 자동 로그인 토큰 삭제
 */
export const removeAutoLoginToken = (): void => {
  try {
    localStorage.removeItem(AUTO_LOGIN_KEY);
    console.log('자동 로그인 토큰 삭제 완료');
  } catch (error) {
    console.error('자동 로그인 토큰 삭제 실패:', error);
  }
};

/**
 * 자동 로그인 토큰 유효성 확인
 */
export const isAutoLoginTokenValid = (): boolean => {
  const token = getAutoLoginToken();
  return token !== null;
};

/**
 * 보안 토큰 생성 (간단한 랜덤 문자열)
 */
const generateSecureToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * 토큰 만료 시간 포맷팅
 */
export const formatTokenExpiry = (expires: number): string => {
  const date = new Date(expires);
  return date.toLocaleString('ko-KR');
};
