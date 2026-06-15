import { useState, useEffect, useCallback } from 'react';

interface PaginationOptions {
  pageSize?: number;
  initialPage?: number;
}

interface PaginatedResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  refresh: () => void;
}

export function usePaginatedQuery<T = any>(
  tableName: string,
  fetchFunction: (page: number, pageSize: number) => Promise<{ data: T[]; count: number }>,
  options: PaginationOptions = {}
): PaginatedResult<T> {
  const { pageSize = 20, initialPage = 1 } = options;
  
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const fetchData = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      const result = await fetchFunction(page, pageSize);
      
      setData(result.data);
      setTotalCount(result.count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, pageSize]);

  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);

  const refresh = useCallback(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    refresh,
  };
}

// Advanced version with custom fetch function
export function usePaginatedQueryAdvanced<T = any>(
  tableName: string,
  fetchFunction: (page: number, pageSize: number) => Promise<{ data: T[]; count: number }>,
  options: PaginationOptions = {}
): PaginatedResult<T> {
  const { pageSize = 20, initialPage = 1 } = options;
  
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const fetchData = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      const result = await fetchFunction(page, pageSize);
      
      setData(result.data);
      setTotalCount(result.count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, pageSize]);

  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);

  const refresh = useCallback(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    refresh,
  };
}
