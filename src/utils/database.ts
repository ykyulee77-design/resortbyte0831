// 데이터베이스 분산 유틸리티
export {};
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { globalCache, CACHE_KEYS, CACHE_TTL } from './cache';

// 읽기 전용 복제본 설정 (향후 확장용)
const READ_REPLICAS = {
  primary: db,
  // secondary: db, // 향후 읽기 전용 복제본 추가 가능
};

/**
 * 읽기 작업용 데이터베이스 선택
 */
const getReadDb = () => {
  // 현재는 단일 DB, 향후 복제본 추가 시 로드 밸런싱 적용
  return READ_REPLICAS.primary;
};

/**
 * 쓰기 작업용 데이터베이스 선택
 */
const getWriteDb = () => {
  return READ_REPLICAS.primary;
};

/**
 * 캐시를 활용한 읽기 작업
 */
export const cachedRead = async <T>(
  collectionName: string,
  cacheKey: string,
  queryFn: () => Promise<T[]>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T[]> => {
  // 캐시에서 먼저 확인
  const cached = globalCache.get<T[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // 데이터베이스에서 조회
  const data = await queryFn();
  
  // 캐시에 저장
  globalCache.set(cacheKey, data, ttl);
  
  return data;
};

/**
 * 페이지네이션된 읽기 작업
 */
export const paginatedRead = async <T>(
  collectionName: string,
  page: number = 1,
  pageSize: number = 20,
  filters: { [key: string]: any } = {},
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> => {
  const db = getReadDb();
  const collectionRef = collection(db, collectionName);
  
  // 쿼리 구성
  let q = query(collectionRef);
  
  // 필터 적용
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      q = query(q, where(key, '==', value));
    }
  });
  
  // 정렬 적용
  q = query(q, orderBy(sortBy, sortOrder));
  
  // 페이지네이션 적용
  const offset = (page - 1) * pageSize;
  q = query(q, limit(pageSize));
  
  if (offset > 0) {
    // startAfter 구현 (실제로는 더 복잡한 로직 필요)
    q = query(q, limit(pageSize));
  }
  
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as T[];
  
  // 전체 개수 조회 (실제로는 별도 카운터 컬렉션 사용 권장)
  const totalSnapshot = await getDocs(collectionRef);
  const totalItems = totalSnapshot.size;
  
  return {
    data,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalItems / pageSize),
      totalItems,
      hasNext: page * pageSize < totalItems,
      hasPrev: page > 1,
    }
  };
};

/**
 * 쓰기 작업 (캐시 무효화 포함)
 */
export const writeWithCacheInvalidation = async <T>(
  collectionName: string,
  data: T,
  cacheKeysToInvalidate: string[] = []
): Promise<string> => {
  const db = getWriteDb();
  const collectionRef = collection(db, collectionName);
  
  // 데이터베이스에 쓰기
  const docRef = await addDoc(collectionRef, {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  // 관련 캐시 무효화
  cacheKeysToInvalidate.forEach(key => {
    globalCache.delete(key);
  });
  
  return docRef.id;
};

/**
 * 업데이트 작업 (캐시 무효화 포함)
 */
export const updateWithCacheInvalidation = async <T>(
  collectionName: string,
  docId: string,
  data: Partial<T>,
  cacheKeysToInvalidate: string[] = []
): Promise<void> => {
  const db = getWriteDb();
  const docRef = doc(db, collectionName, docId);
  
  // 데이터베이스 업데이트
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date(),
  });
  
  // 관련 캐시 무효화
  cacheKeysToInvalidate.forEach(key => {
    globalCache.delete(key);
  });
};

/**
 * 삭제 작업 (캐시 무효화 포함)
 */
export const deleteWithCacheInvalidation = async (
  collectionName: string,
  docId: string,
  cacheKeysToInvalidate: string[] = []
): Promise<void> => {
  const db = getWriteDb();
  const docRef = doc(db, collectionName, docId);
  
  // 데이터베이스에서 삭제
  await deleteDoc(docRef);
  
  // 관련 캐시 무효화
  cacheKeysToInvalidate.forEach(key => {
    globalCache.delete(key);
  });
};
