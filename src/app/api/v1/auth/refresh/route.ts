import type { NextRequest } from 'next/server';

import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { UnauthorizedError } from '@/lib/errors';
import { getRequestContext } from '@/middlewares/request-context';
import { authService } from '@/services/auth/auth.service';
import {
  getRefreshTokenFromRequest,
  setAuthCookies,
} from '@/services/auth/cookie.service';

export const POST = withApiHandler(async (request: NextRequest) => {
  const refreshToken = getRefreshTokenFromRequest(request);

  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token required');
  }

  const { ipAddress, userAgent } = getRequestContext(request);
  const result = await authService.refresh(refreshToken, ipAddress, userAgent);

  const response = successResponse(null, 'Token refreshed');
  return setAuthCookies(response, result.accessToken, result.refreshToken);
});
