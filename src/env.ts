// Environment helper for client-side builds (CRA)
export function getNaverMapClientId(): string | undefined {
  return process.env.REACT_APP_NAVER_CLIENT_ID;
} 