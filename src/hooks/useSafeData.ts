import { useState, useEffect, useCallback } from 'react';
import { withErrorHandling } from '../utils/errorHandler';

interface UseSafeDataOptions<T> {
  initialData?: T;
  onError?: (error: any) => void;
  onSuccess?: (data: T) => void;
  retryCount?: number;
  retryDelay?: number;
}

interface UseSafeDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: any;
  refetch: () => Promise<void>;
  setData: (data: T | null) => void;
}

export function useSafeData<T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: UseSafeDataOptions<T> = {}
): UseSafeDataReturn<T> {
  const {
    initialData = null,
    onError,
    onSuccess,
    retryCount = 3,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await withErrorHandling(fetchFunction, 'useSafeData');
      if (result !== null) {
        setData(result);
        onSuccess?.(result);
      }
    } catch (err: any) {
      setError(err);
      onError?.(err);

      // 재시도 로직
      if (retryAttempts < retryCount) {
        setTimeout(() => {
          setRetryAttempts(prev => prev + 1);
          fetchData();
        }, retryDelay);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, onError, onSuccess, retryAttempts, retryCount, retryDelay]);

  const refetch = useCallback(async () => {
    setRetryAttempts(0);
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [...dependencies, retryAttempts]);

  return {
    data,
    loading,
    error,
    refetch,
    setData,
  };
}

// 안전한 상태 업데이트를 위한 훅
export function useSafeState<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<any>(null);

  const safeSetValue = useCallback((newValue: T | ((prev: T) => T)) => {
    try {
      setValue(newValue);
      setError(null);
    } catch (err) {
      setError(err);
      console.error('State update error:', err);
    }
  }, []);

  return [value, safeSetValue, error] as const;
}

// 안전한 로컬 스토리지 훅
export function useSafeLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useSafeState<T>(initialValue);
  
  // 초기값 로드
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
  }, [key, setStoredValue]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue, setStoredValue]);

  return [storedValue, setValue] as const;
}

// 안전한 세션 스토리지 훅
export function useSafeSessionStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useSafeState<T>(initialValue);
  
  // 초기값 로드
  useEffect(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
    }
  }, [key, setStoredValue]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, storedValue, setStoredValue]);

  return [storedValue, setValue] as const;
}
