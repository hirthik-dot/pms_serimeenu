import { NextResponse, type NextRequest } from 'next/server';

import { AUTH, CUSTOM_HEADERS } from '@/constants/app';
import {
  getDashboardPathForRole,
  isPublicApiRoute,
  isPublicRoute,
} from '@/constants/auth-routes';
import { verifyAccessToken } from '@/services/auth/jwt.service';
import type { UserRole } from '@/types/enums';

const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/users', '/settings', '/patients'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function getAccessTokenFromRequest(request: NextRequest): string | undefined {
  const cookieToken = request.cookies.get(AUTH.ACCESS_TOKEN_COOKIE)?.value;
  if (cookieToken) return cookieToken;

  const authHeader = request.headers.get(AUTH.ACCESS_TOKEN_HEADER);
  if (authHeader?.startsWith(AUTH.TOKEN_PREFIX)) {
    return authHeader.slice(AUTH.TOKEN_PREFIX.length);
  }

  return undefined;
}

async function getAuthPayload(request: NextRequest) {
  const token = getAccessTokenFromRequest(request);
  if (!token) return null;

  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get(CUSTOM_HEADERS.REQUEST_ID) ?? crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CUSTOM_HEADERS.REQUEST_ID, requestId);

  const isApi = pathname.startsWith('/api/');
  const isPublic = isPublicRoute(pathname) || (isApi && isPublicApiRoute(pathname));


  // CSRF Protection for state-mutating API requests
  const method = request.method.toUpperCase();
  const isMutatingRequest = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  
  if (isApi && isMutatingRequest) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host') || '';
    
    if (origin) {
      try {
        const originUrl = new URL(origin);
        // Compare origin host with the request host header
        // In a real production setup with a proxy, you might need to check X-Forwarded-Host
        const forwardedHost = request.headers.get('x-forwarded-host');
        const expectedHost = forwardedHost || host;
        
        if (originUrl.host !== expectedHost) {
          return NextResponse.json(
            { success: false, data: null, message: 'Forbidden: Invalid Origin (CSRF)', errors: [] },
            { status: 403 },
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, data: null, message: 'Forbidden: Malformed Origin (CSRF)', errors: [] },
          { status: 403 },
        );
      }
    } else {
      // If no Origin header, browsers might omit it for same-origin requests in some cases,
      // but they always send it for cross-origin. For extra safety, we can require a custom header.
      const contentType = request.headers.get('content-type') || '';
      // Simple form posts without origin are suspicious. API should use JSON.
      if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
         // Require origin for forms
         return NextResponse.json(
            { success: false, data: null, message: 'Forbidden: Missing Origin for form submission (CSRF)', errors: [] },
            { status: 403 },
          );
      }
    }
  }
  const payload = isPublic ? null : await getAuthPayload(request);

  if (isApi) {
    if (!isPublic && !payload) {
      return NextResponse.json(
        { success: false, data: null, message: 'Authentication required', errors: [] },
        { status: 401 },
      );
    }

    if (payload) {
      requestHeaders.set(CUSTOM_HEADERS.USER_ID, payload.sub);
      requestHeaders.set(CUSTOM_HEADERS.USER_ROLE, payload.role);
      requestHeaders.set(CUSTOM_HEADERS.USER_EMAIL, payload.email);
      requestHeaders.set(CUSTOM_HEADERS.USER_PERMISSIONS, payload.permissions.join(','));
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  if (isPublicRoute(pathname) && payload && pathname !== '/checkin') {
    const dashboardPath = getDashboardPathForRole(payload.role as UserRole);
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  if (isProtectedPath(pathname) && !payload) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
