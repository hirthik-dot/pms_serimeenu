import type { NextRequest } from 'next/server';

import { getEnv } from '@/config/env';
import { ForbiddenError } from '@/lib/errors';

function isLocalDevOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/**
 * CSRF protection via Origin/Referer validation for state-changing requests.
 * Cookies use SameSite=lax; this adds defense-in-depth for cross-origin POST/PATCH/DELETE.
 */
export function validateCsrfOrigin(request: NextRequest): void {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return;
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  const env = getEnv();

  if (!origin && !referer) {
    if (env.NODE_ENV === 'production') {
      throw new ForbiddenError('Missing Origin and Referer headers');
    }
    return;
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const requestOrigin = origin ?? (referer ? new URL(referer).origin : null);

  if (!requestOrigin) {
    return;
  }

  if (env.NODE_ENV === 'development' && isLocalDevOrigin(requestOrigin)) {
    return;
  }

  const allowedOrigins = new Set([appUrl, appUrl.replace(/\/$/, '')]);

  if (!allowedOrigins.has(requestOrigin)) {
    throw new ForbiddenError('Invalid request origin');
  }
}
