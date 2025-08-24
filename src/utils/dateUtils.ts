import { Timestamp } from 'firebase/firestore';
import { DateOrTimestamp } from '../types';

// 타입 가드 함수들
export const isTimestamp = (value: any): value is Timestamp => {
  return value && typeof value.toDate === 'function';
};

export const isDate = (value: any): value is Date => {
  return value instanceof Date;
};

export const isDateOrTimestamp = (value: any): value is DateOrTimestamp => {
  return isTimestamp(value) || isDate(value);
};

// Timestamp를 Date로 변환하는 함수
export const convertTimestampToDate = (timestamp: DateOrTimestamp | undefined | null): Date | null => {
  if (!timestamp) return null;
  
  if (isTimestamp(timestamp)) {
    return timestamp.toDate();
  }
  
  if (isDate(timestamp)) {
    return timestamp;
  }
  
  return null;
};

// 날짜를 포맷팅하는 함수
export const formatDate = (
  timestamp: DateOrTimestamp | undefined | null, 
  locale = 'ko-KR',
  options?: Intl.DateTimeFormatOptions,
): string => {
  const date = convertTimestampToDate(timestamp);
  if (!date) return '날짜 없음';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  return date.toLocaleDateString(locale, defaultOptions);
};

// 시간을 포함한 포맷팅
export const formatDateTime = (
  timestamp: DateOrTimestamp | undefined | null,
  locale = 'ko-KR',
): string => {
  const date = convertTimestampToDate(timestamp);
  if (!date) return '날짜 없음';
  
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ISO 문자열로 변환하는 함수
export const toISOString = (timestamp: DateOrTimestamp | undefined | null): string => {
  const date = convertTimestampToDate(timestamp);
  if (!date) return '';
  
  return date.toISOString();
};

// 날짜 비교를 위한 함수
export const createDateFromTimestamp = (timestamp: DateOrTimestamp | undefined | null): Date | null => {
  return convertTimestampToDate(timestamp);
};

// 상대적 시간 표시 (예: "3일 전", "1시간 전")
export const formatRelativeTime = (
  timestamp: DateOrTimestamp | undefined | null,
  locale = 'ko-KR',
): string => {
  const date = convertTimestampToDate(timestamp);
  if (!date) return '날짜 없음';
  
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInMinutes < 1) return '방금 전';
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
  if (diffInHours < 24) return `${diffInHours}시간 전`;
  if (diffInDays < 7) return `${diffInDays}일 전`;
  
  return formatDate(timestamp, locale);
};

// 날짜 유효성 검사
export const isValidDate = (timestamp: DateOrTimestamp | undefined | null): boolean => {
  const date = convertTimestampToDate(timestamp);
  if (!date) return false;
  
  return !isNaN(date.getTime());
};

// 날짜 범위 계산
export const getDateRange = (start: DateOrTimestamp, end: DateOrTimestamp): number => {
  const startDate = convertTimestampToDate(start);
  const endDate = convertTimestampToDate(end);
  
  if (!startDate || !endDate) return 0;
  
  const diffInMs = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24)); // 일 단위
};

// 현재 시간과의 차이 계산
export const getTimeDifference = (timestamp: DateOrTimestamp | undefined | null): {
  days: number;
  hours: number;
  minutes: number;
} => {
  const date = convertTimestampToDate(timestamp);
  if (!date) return { days: 0, hours: 0, minutes: 0 };
  
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  
  const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
};
