import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth } from '@/lib/auth/api-guard';
import { getRequestContext } from '@/middlewares/request-context';
import { authService } from '@/services/auth/auth.service';
import {
  clearAuthCookies,
  getRefreshTokenFromRequest,
} from '@/services/auth/cookie.service';
import { logoutSchema } from '@/validators/auth.validator';

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    const body = await parseJsonBody(request, logoutSchema).catch(() => ({
      allDevices: false,
    }));
    const refreshToken = getRefreshTokenFromRequest(request);
    const { ipAddress, userAgent } = getRequestContext(request);

    await authService.logout(
      auth.userId,
      refreshToken,
      body.allDevices,
      ipAddress,
      userAgent,
    );

    const response = successResponse(null, 'Logout successful');
    return clearAuthCookies(response);
  }),
);
