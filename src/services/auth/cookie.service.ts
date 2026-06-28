import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

import { AUTH } from '@/constants/app';
import {
  getAccessTokenMaxAge,
  getRefreshTokenMaxAge,
} from '@/services/auth/jwt.service';

const isProduction = process.env.NODE_ENV === 'production';

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  rememberMe = false,
): NextResponse {
  response.cookies.set(AUTH.ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: getAccessTokenMaxAge(),
  });

  response.cookies.set(AUTH.REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: getRefreshTokenMaxAge(rememberMe),
  });

  return response;
}

export async function clearAuthCookies(response: NextResponse): Promise<NextResponse> {
  response.cookies.set(AUTH.ACCESS_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set(AUTH.REFRESH_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}

export async function getAccessTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH.ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH.REFRESH_TOKEN_COOKIE)?.value;
}

export function getAccessTokenFromRequest(request: Request): string | undefined {
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = new RegExp(`${AUTH.ACCESS_TOKEN_COOKIE}=([^;]+)`).exec(cookieHeader);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  const authHeader = request.headers.get(AUTH.ACCESS_TOKEN_HEADER);
  if (authHeader?.startsWith(AUTH.TOKEN_PREFIX)) {
    return authHeader.slice(AUTH.TOKEN_PREFIX.length);
  }

  return undefined;
}

export function getRefreshTokenFromRequest(request: Request): string | undefined {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return undefined;

  const match = new RegExp(`${AUTH.REFRESH_TOKEN_COOKIE}=([^;]+)`).exec(cookieHeader);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}
