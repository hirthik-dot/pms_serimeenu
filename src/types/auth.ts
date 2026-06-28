import type { UserRole, UserStatus } from '@/types/enums';

/** JWT access token payload claims. */
export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  permissions: string[];
  tokenVersion: number;
}

/** JWT refresh token payload claims. */
export interface RefreshTokenPayload {
  sub: string;
  tokenVersion: number;
  jti: string;
}

/** Authenticated user context attached to API requests. */
export interface AuthContext {
  userId: string;
  email: string;
  role: UserRole;
  permissions: string[];
  tokenVersion: number;
}

/** Safe user object returned to clients (never includes secrets). */
export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  permissions: string[];
  avatar?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Login response data shape. */
export interface LoginResponseData {
  user: Pick<
    AuthUser,
    'id' | 'firstName' | 'lastName' | 'email' | 'role' | 'permissions'
  >;
}

/** Session configuration for remember-me. */
export interface SessionOptions {
  rememberMe?: boolean;
}
