import { PAGINATION } from '@/constants/app';
import { buildPaginationMeta } from '@/lib/api-response';
import type { PaginationMeta, PaginationParams } from '@/types/api';

export interface NormalizedPagination {
  page: number;
  limit: number;
  skip: number;
}

export function normalizePaginationParams(params: PaginationParams = {}): NormalizedPagination {
  const page = Math.max(params.page ?? PAGINATION.DEFAULT_PAGE, 1);
  const limit = Math.min(
    Math.max(params.limit ?? PAGINATION.DEFAULT_LIMIT, 1),
    PAGINATION.MAX_LIMIT,
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function createPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return buildPaginationMeta(total, page, limit);
}

export function getSortOrder(sortOrder?: 'asc' | 'desc'): 1 | -1 {
  return sortOrder === 'asc' ? 1 : -1;
}
