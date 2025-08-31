// 캐싱 유틸리티
export {};
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live (밀리초)
}

class Cache {
  private cache = new Map<string, CacheItem<any>>();

  /**
   * 캐시에 데이터 저장
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * 캐시에서 데이터 조회
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // TTL 확인
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * 캐시 삭제
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 전체 캐시 삭제
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 만료된 캐시 정리
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });
  }

  /**
   * 캐시 크기 반환
   */
  size(): number {
    return this.cache.size;
  }
}

// 전역 캐시 인스턴스
export const globalCache = new Cache();

// 자주 사용되는 캐시 키들
export const CACHE_KEYS = {
  JOB_POSTS: 'job_posts',
  COMPANY_INFO: 'company_info',
  ACCOMMODATION_INFO: 'accommodation_info',
  USER_PROFILE: 'user_profile',
  REVIEWS: 'reviews',
} as const;

// 캐시 TTL 설정
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000, // 1분
  MEDIUM: 5 * 60 * 1000, // 5분
  LONG: 30 * 60 * 1000, // 30분
  VERY_LONG: 2 * 60 * 60 * 1000, // 2시간
} as const;

// 주기적으로 만료된 캐시 정리
setInterval(() => {
  globalCache.cleanup();
}, 5 * 60 * 1000); // 5분마다 정리
