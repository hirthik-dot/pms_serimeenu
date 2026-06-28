import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import type { ApiResponse, PaginationMeta, ValidationError as ValidationErrorType } from '@/types/api';

import { AppError, InternalError, ValidationError } from './errors';
import { logger } from './logger';

export function successResponse<T>(
  data: T,
  message = 'Success',
  status = 200,
  meta?: PaginationMeta,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      meta,
      errors: [],
    },
    { status },
  );
}

export function createdResponse<T>(
  data: T,
  message = 'Created successfully',
): NextResponse<ApiResponse<T>> {
  return successResponse(data, message, 201);
}

export function paginatedResponse<T>(
  data: T[],
  meta: PaginationMeta,
  message = 'Success',
): NextResponse<ApiResponse<T[]>> {
  return successResponse(data, message, 200, meta);
}

export function errorResponse(error: unknown): NextResponse<ApiResponse<null>> {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: error.message,
        errors: error.errors,
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: error.message,
        errors: [],
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    const validationErrors: ValidationErrorType[] = error.issues.map((issue) => ({
      field: issue.path.join('.') || 'root',
      message: issue.message,
    }));

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: 'Validation failed',
        errors: validationErrors,
      },
      { status: 400 },
    );
  }

  logger.error('Unhandled API error', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });

  const message =
    process.env.NODE_ENV === 'development' && error instanceof Error
      ? error.message
      : new InternalError().message;

  return NextResponse.json(
    {
      success: false,
      data: null,
      message,
      errors: [],
    },
    { status: 500 },
  );
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit) || 0;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
