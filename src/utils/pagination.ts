// 페이지네이션 유틸리티
export {};
export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 페이지네이션 계산 유틸리티
 */
export const calculatePagination = (options: PaginationOptions) => {
  const { page, limit, total } = options;
  const totalPages = Math.ceil(total / limit);
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Firestore 쿼리에 페이지네이션 적용
 */
export const applyPagination = <T>(
  data: T[],
  page: number,
  limit: number
): PaginatedResult<T> => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = data.slice(startIndex, endIndex);
  
  return {
    data: paginatedData,
    pagination: calculatePagination({
      page,
      limit,
      total: data.length,
    }),
  };
};

/**
 * 무한 스크롤을 위한 커서 기반 페이지네이션
 */
export const createCursorPagination = <T>(
  data: T[],
  cursor: string | null,
  limit: number,
  getCursor: (item: T) => string
): { data: T[]; nextCursor: string | null } => {
  if (!cursor) {
    return {
      data: data.slice(0, limit),
      nextCursor: data.length > limit ? getCursor(data[limit - 1]) : null,
    };
  }

  const cursorIndex = data.findIndex(item => getCursor(item) === cursor);
  if (cursorIndex === -1) {
    return { data: [], nextCursor: null };
  }

  const startIndex = cursorIndex + 1;
  const endIndex = startIndex + limit;
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    nextCursor: endIndex < data.length ? getCursor(data[endIndex - 1]) : null,
  };
};
