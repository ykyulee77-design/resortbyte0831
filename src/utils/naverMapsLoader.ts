// 지도 기능은 현재 개발 중입니다
import { getNaverMapClientId } from '../env';

export function loadNaverMaps(): Promise<any> {
  return Promise.reject(new Error('지도 기능은 현재 개발 중입니다'));
} 