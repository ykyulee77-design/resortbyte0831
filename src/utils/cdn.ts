// CDN 유틸리티
export {};
export interface CDNConfig {
  baseUrl: string;
  imageOptimization: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  };
}

// Firebase Storage CDN 설정
const firebaseCDN: CDNConfig = {
  baseUrl: 'https://firebasestorage.googleapis.com',
  imageOptimization: {
    width: 800,
    height: 600,
    quality: 80,
    format: 'webp',
  },
};

/**
 * Firebase Storage URL을 CDN 최적화 URL로 변환
 */
export const optimizeImageUrl = (
  originalUrl: string,
  options: Partial<CDNConfig['imageOptimization']> = {}
): string => {
  if (!originalUrl || !originalUrl.includes('firebasestorage.googleapis.com')) {
    return originalUrl;
  }

  // Firebase Storage URL에서 토큰 제거
  const baseUrl = originalUrl.split('?')[0];
  
  // CDN 최적화 파라미터 추가
  const params = new URLSearchParams();
  
  if (options.width) params.append('w', options.width.toString());
  if (options.height) params.append('h', options.height.toString());
  if (options.quality) params.append('q', options.quality.toString());
  if (options.format) params.append('f', options.format);
  
  // 캐시 버스터 추가
  params.append('v', Date.now().toString());
  
  return `${baseUrl}?${params.toString()}`;
};

/**
 * 썸네일 이미지 URL 생성
 */
export const createThumbnailUrl = (originalUrl: string): string => {
  return optimizeImageUrl(originalUrl, {
    width: 300,
    height: 200,
    quality: 70,
    format: 'webp',
  });
};

/**
 * 중간 크기 이미지 URL 생성
 */
export const createMediumImageUrl = (originalUrl: string): string => {
  return optimizeImageUrl(originalUrl, {
    width: 800,
    height: 600,
    quality: 80,
    format: 'webp',
  });
};

/**
 * 원본 이미지 URL 생성 (최적화 없음)
 */
export const createOriginalImageUrl = (originalUrl: string): string => {
  return optimizeImageUrl(originalUrl, {
    quality: 90,
  });
};

/**
 * 이미지 지연 로딩을 위한 placeholder URL 생성
 */
export const createPlaceholderUrl = (width: number = 300, height: number = 200): string => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='14'%3E이미지 로딩 중...%3C/text%3E%3C/svg%3E`;
};
