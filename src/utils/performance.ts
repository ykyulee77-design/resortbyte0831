// 디바운스 함수 - 연속된 이벤트를 제한
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 쓰로틀 함수 - 일정 시간 간격으로 함수 실행 제한
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// 메모이제이션 함수 - 동일한 입력에 대한 결과를 캐시
export const memoize = <T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string,
): T => {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// 이미지 지연 로딩을 위한 Intersection Observer 래퍼
export const createLazyLoadObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {},
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };
  
  return new IntersectionObserver(callback, defaultOptions);
};

// 가상 스크롤링을 위한 아이템 계산
export const calculateVirtualScrollItems = (
  totalItems: number,
  containerHeight: number,
  itemHeight: number,
  scrollTop: number,
) => {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, totalItems);
  
  return {
    startIndex,
    endIndex,
    visibleItems: Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i),
    totalHeight: totalItems * itemHeight,
    offsetY: startIndex * itemHeight,
  };
};

// 성능 측정을 위한 유틸리티
export const measurePerformance = <T extends (...args: any[]) => any>(
  name: string,
  func: T,
): ((...args: Parameters<T>) => ReturnType<T>) => {
  return (...args: Parameters<T>) => {
    const start = performance.now();
    const result = func(...args);
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${name} 실행 시간: ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  };
};

// 비동기 작업의 성능 측정
export const measureAsyncPerformance = async <T>(
  name: string,
  asyncFunc: () => Promise<T>,
): Promise<T> => {
  const start = performance.now();
  const result = await asyncFunc();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${name} 실행 시간: ${(end - start).toFixed(2)}ms`);
  }
  
  return result;
};

// 컴포넌트 렌더링 최적화를 위한 비교 함수
export const shallowEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key) || obj1[key] !== obj2[key]) {
      return false;
    }
  }
  
  return true;
};

// 배열 비교 함수
export const arrayShallowEqual = (arr1: any[], arr2: any[]): boolean => {
  if (arr1.length !== arr2.length) return false;
  
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  
  return true;
};

// 객체 깊은 복사 (성능 최적화 버전)
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const clonedObj = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  
  return obj;
};

// 메모리 사용량 모니터링 (개발 환경에서만)
export const logMemoryUsage = (label = 'Memory Usage'): void => {
  if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
    const memory = (performance as any).memory;
    console.log(`${label}:`, {
      used: `${Math.round(memory.usedJSHeapSize / 1048576)} MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1048576)} MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)} MB`,
    });
  }
};
