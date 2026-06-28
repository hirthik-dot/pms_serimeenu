import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { validateCsrfOrigin } from '@/lib/auth/csrf';
import { sanitizeObject } from '@/lib/auth/sanitize';
import { getRequestContext } from '@/middlewares/request-context';
import { authService } from '@/services/auth/auth.service';
import { forgotPasswordSchema } from '@/validators/auth.validator';

export const POST = withApiHandler(async (request: NextRequest) => {
  validateCsrfOrigin(request);

  const body = sanitizeObject(await parseJsonBody(request, forgotPasswordSchema));
  const { ipAddress } = getRequestContext(request);

  await authService.forgotPassword(body.email, ipAddress);

  return successResponse(
    null,
    'If the email exists, a reset link has been sent',
  );
});
