// =============================================================================
// API Response Types
// =============================================================================
// Every API endpoint returns ApiResponse<T>. This guarantees a consistent
// contract between server and client.
// =============================================================================

/**
 * Standard API response wrapper.
 * All route handlers must return this shape.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  errors?: ValidationError[];
  meta?: PaginationMeta;
}

/**
 * Pagination metadata included in list responses.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Field-level validation error detail.
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Query parameters for paginated list endpoints.
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

/**
 * Convenience type for paginated API responses.
 */
export type PaginatedResponse<T> = ApiResponse<T[]>;

/**
 * HTTP methods used in API routes.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Type for API route handler functions.
 */
export type RouteHandler = (
  request: Request,
  context: { params: Promise<Record<string, string>> },
) => Promise<Response>;
