import type { NextRequest } from 'next/server';


import { validateCsrfOrigin } from '@/lib/auth/csrf';
import { ForbiddenError } from '@/lib/errors';
import { authService } from '@/services/auth/auth.service';
import { getAccessTokenFromRequest } from '@/services/auth/cookie.service';
import {
  hasAllPermissions,
  hasAnyPermission,
} from '@/services/auth/permission.service';
import type { AuthContext } from '@/types/auth';
import type { UserRole } from '@/types/enums';

export type AuthenticatedHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
  auth: AuthContext,
) => Promise<Response>;

export interface AuthGuardOptions {
  permissions?: string[];
  roles?: UserRole[];
  requireAllPermissions?: boolean;
}

export function withAuth(
  handler: AuthenticatedHandler,
  options: AuthGuardOptions = {},
): (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => Promise<Response> {
  return async (request, context) => {
    validateCsrfOrigin(request);

    const accessToken = getAccessTokenFromRequest(request);
    const auth = await authService.authenticateRequest(accessToken);

    if (options.roles?.length && !options.roles.includes(auth.role)) {
      throw new ForbiddenError();
    }

    if (options.permissions?.length) {
      const check = options.requireAllPermissions ? hasAllPermissions : hasAnyPermission;
      const allowed = check(auth.permissions, options.permissions);
      if (!allowed) {
        throw new ForbiddenError();
      }
    }

    const response = await handler(request, context, auth);

    return response;
  };
}

export function requirePermission(
  auth: AuthContext,
  permission: string,
): void {
  if (!hasAnyPermission(auth.permissions, [permission])) {
    throw new ForbiddenError();
  }
}

export async function getOptionalAuth(request: NextRequest): Promise<AuthContext | null> {
  try {
    const accessToken = getAccessTokenFromRequest(request);
    if (!accessToken) return null;
    return await authService.authenticateRequest(accessToken);
  } catch {
    return null;
  }
}
