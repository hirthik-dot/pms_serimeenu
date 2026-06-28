import type { NextRequest } from 'next/server';

import type { RouteHandler } from '@/types/api';

import { errorResponse } from './api-response';
import { logger } from './logger';

type HandlerContext = {
  params: Promise<Record<string, string>>;
};

type ApiHandler = (request: NextRequest, context: HandlerContext) => Promise<Response>;

export function withApiHandler(handler: ApiHandler): RouteHandler {
  return async (request, context) => {
    const nextRequest = request as NextRequest;

    try {
      return await handler(nextRequest, context);
    } catch (error) {
      logger.error('API handler error', {
        path: nextRequest.nextUrl.pathname,
        method: nextRequest.method,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return errorResponse(error);
    }
  };
}

export async function parseJsonBody<T>(
  request: NextRequest,
  schema: { parse: (data: unknown) => T },
): Promise<T> {
  const body: unknown = await request.json();
  return schema.parse(body);
}

export function parseSearchParams<T>(
  request: NextRequest,
  schema: { parse: (data: unknown) => T },
): T {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  return schema.parse(params);
}
