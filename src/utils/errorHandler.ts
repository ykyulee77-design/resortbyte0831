// 에러 타입 정의
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Firebase 에러 코드를 사용자 친화적인 메시지로 변환
export const getFirebaseErrorMessage = (errorCode: string): string => {
  const errorMessages: { [key: string]: string } = {
    'auth/user-not-found': '등록되지 않은 사용자입니다.',
    'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
    'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
    'auth/weak-password': '비밀번호가 너무 약합니다.',
    'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
    'auth/too-many-requests': '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
    'permission-denied': '접근 권한이 없습니다.',
    'not-found': '요청한 데이터를 찾을 수 없습니다.',
    'already-exists': '이미 존재하는 데이터입니다.',
    'invalid-argument': '잘못된 입력값입니다.',
    'unavailable': '서비스가 일시적으로 사용할 수 없습니다.',
    'deadline-exceeded': '요청 시간이 초과되었습니다.',
    'resource-exhausted': '리소스가 부족합니다.',
    'failed-precondition': '작업을 수행할 수 없는 상태입니다.',
    'aborted': '작업이 중단되었습니다.',
    'out-of-range': '범위를 벗어난 값입니다.',
    'unimplemented': '구현되지 않은 기능입니다.',
    'internal': '내부 서버 오류가 발생했습니다.',
    'data-loss': '데이터 손실이 발생했습니다.',
    'unauthenticated': '인증이 필요합니다.',
  };

  return errorMessages[errorCode] || '알 수 없는 오류가 발생했습니다.';
};

// 에러 로깅 함수
export const logError = (error: any, context?: string): void => {
  const errorInfo = {
    message: error.message || 'Unknown error',
    code: error.code || 'UNKNOWN',
    context: context || 'Unknown context',
    timestamp: new Date().toISOString(),
    stack: error.stack,
  };

  // 개발 환경에서는 콘솔에 출력
  if (process.env.NODE_ENV === 'development') {
    console.error('Error occurred:', errorInfo);
  }

  // 프로덕션에서는 에러 추적 서비스로 전송 (예: Sentry)
  // TODO: 에러 추적 서비스 연동
};

// 사용자에게 표시할 에러 메시지 생성
export const createUserFriendlyError = (error: any): AppError => {
  const firebaseMessage = getFirebaseErrorMessage(error.code);
  
  return {
    code: error.code || 'UNKNOWN_ERROR',
    message: firebaseMessage,
    details: error.details || null,
  };
};

// 비동기 작업을 위한 에러 처리 래퍼
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context?: string,
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    logError(error, context);
    throw createUserFriendlyError(error);
  }
};

// 폼 검증 에러 처리
export const validateForm = (data: any, rules: { [key: string]: (value: any) => string | null }): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};

  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = data[field];
    const error = rule(value);
    
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};

// 네트워크 에러 처리
export const handleNetworkError = (error: any): string => {
  if (error.code === 'NETWORK_ERROR' || error.message.includes('network')) {
    return '네트워크 연결을 확인해주세요.';
  }
  
  if (error.code === 'TIMEOUT') {
    return '요청 시간이 초과되었습니다. 다시 시도해주세요.';
  }
  
  return '서버와의 통신 중 오류가 발생했습니다.';
};

// 파일 업로드 에러 처리
export const handleFileUploadError = (error: any): string => {
  if (error.code === 'storage/unauthorized') {
    return '파일 업로드 권한이 없습니다.';
  }
  
  if (error.code === 'storage/quota-exceeded') {
    return '저장 공간이 부족합니다.';
  }
  
  if (error.code === 'storage/invalid-format') {
    return '지원하지 않는 파일 형식입니다.';
  }
  
  if (error.code === 'storage/file-too-large') {
    return '파일 크기가 너무 큽니다.';
  }
  
  return '파일 업로드 중 오류가 발생했습니다.';
};
