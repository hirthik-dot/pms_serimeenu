// =============================================================================
// usePagination Hook
// =============================================================================

import { useCallback, useState } from 'react';

import { PAGINATION } from '@/constants/app';

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

interface UsePaginationReturn {
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetPage: () => void;
}

/**
 * Manage pagination state for list views.
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = PAGINATION.DEFAULT_PAGE,
    initialLimit = PAGINATION.DEFAULT_LIMIT,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const nextPage = useCallback(() => setPage((prev) => prev + 1), []);
  const prevPage = useCallback(() => setPage((prev) => Math.max(1, prev - 1)), []);
  const resetPage = useCallback(() => setPage(initialPage), [initialPage]);

  return { page, limit, setPage, setLimit, nextPage, prevPage, resetPage };
}
