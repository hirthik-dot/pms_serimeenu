import type { NextRequest } from 'next/server';

import { CUSTOM_HEADERS } from '@/constants/app';

export function getRequestId(request: NextRequest): string {
  return request.headers.get(CUSTOM_HEADERS.REQUEST_ID) ?? crypto.randomUUID();
}

export function getRequestContext(request: NextRequest): {
  requestId: string;
  ipAddress: string;
  userAgent: string;
  pathname: string;
} {
  return {
    requestId: getRequestId(request),
    ipAddress:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown',
    userAgent: request.headers.get('user-agent') ?? 'unknown',
    pathname: request.nextUrl.pathname,
  };
}
