// =============================================================================
// Repository Pagination Helper
// =============================================================================

import { PAGINATION } from '@/constants/app';
import type { PaginationMeta } from '@/types/api';
import { createPaginationMeta } from '@/utils/pagination';

export interface RepositoryPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RepositoryPaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function normalizeRepositoryPagination(
  options: RepositoryPaginationOptions = {},
): { page: number; limit: number; skip: number; sortBy: string; sortOrder: 1 | -1 } {
  const page = Math.max(options.page ?? PAGINATION.DEFAULT_PAGE, 1);
  const limit = Math.min(
    Math.max(options.limit ?? PAGINATION.DEFAULT_LIMIT, 1),
    PAGINATION.MAX_LIMIT,
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sortBy: options.sortBy ?? 'createdAt',
    sortOrder: options.sortOrder === 'asc' ? 1 : -1,
  };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): RepositoryPaginatedResult<T> {
  return {
    data,
    meta: createPaginationMeta(total, page, limit),
  };
}

export function buildSortObject(
  sortBy: string,
  sortOrder: 1 | -1,
  allowedFields: string[],
  fallback = 'createdAt',
): Record<string, 1 | -1> {
  const field = allowedFields.includes(sortBy) ? sortBy : fallback;
  return { [field]: sortOrder };
}
