import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

import { getEnv } from '@/config/env';
import type { AccessTokenPayload, RefreshTokenPayload } from '@/types/auth';

const DEV_ACCESS_SECRET = 'dev-access-secret-minimum-32-characters!!';
const DEV_REFRESH_SECRET = 'dev-refresh-secret-minimum-32-characters!';

function getAccessSecret(): Uint8Array {
  const env = getEnv();
  const secret =
    env.JWT_ACCESS_SECRET ??
    (env.NODE_ENV === 'production' ? undefined : DEV_ACCESS_SECRET);

  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is required in production');
  }

  return new TextEncoder().encode(secret);
}

function getRefreshSecret(): Uint8Array {
  const env = getEnv();
  const secret =
    env.JWT_REFRESH_SECRET ??
    (env.NODE_ENV === 'production' ? undefined : DEV_REFRESH_SECRET);

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is required in production');
  }

  return new TextEncoder().encode(secret);
}

function parseDurationToSeconds(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 900;

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return 900;
  }
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  const { JWT_ACCESS_EXPIRES_IN } = getEnv();
  const expiresIn = parseDurationToSeconds(JWT_ACCESS_EXPIRES_IN);

  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(getAccessSecret());
}

export async function signRefreshToken(
  payload: RefreshTokenPayload,
  rememberMe = false,
): Promise<string> {
  const { JWT_REFRESH_EXPIRES_IN } = getEnv();
  const baseDuration = rememberMe ? '30d' : JWT_REFRESH_EXPIRES_IN;
  const expiresIn = parseDurationToSeconds(baseDuration);

  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setJti(payload.jti)
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(getRefreshSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, getAccessSecret());
  return payload as unknown as AccessTokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, getRefreshSecret());
  return payload as unknown as RefreshTokenPayload;
}

export function getAccessTokenMaxAge(): number {
  return parseDurationToSeconds(getEnv().JWT_ACCESS_EXPIRES_IN);
}

export function getRefreshTokenMaxAge(rememberMe = false): number {
  const duration = rememberMe ? '30d' : getEnv().JWT_REFRESH_EXPIRES_IN;
  return parseDurationToSeconds(duration);
}
