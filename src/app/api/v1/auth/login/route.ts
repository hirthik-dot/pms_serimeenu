import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { validateCsrfOrigin } from '@/lib/auth/csrf';
import { sanitizeObject } from '@/lib/auth/sanitize';
import { getRequestContext } from '@/middlewares/request-context';
import { authService } from '@/services/auth/auth.service';
import { setAuthCookies } from '@/services/auth/cookie.service';
import { loginSchema } from '@/validators/auth.validator';

export const POST = withApiHandler(async (request: NextRequest) => {
  validateCsrfOrigin(request);

  const body = sanitizeObject(await parseJsonBody(request, loginSchema));
  const { ipAddress, userAgent } = getRequestContext(request);

  const result = await authService.login(
    body.email,
    body.password,
    ipAddress,
    userAgent,
    { rememberMe: body.rememberMe },
  );

  const response = successResponse({ user: result.user }, 'Login successful');
  return setAuthCookies(response, result.accessToken, result.refreshToken, result.rememberMe);
});
