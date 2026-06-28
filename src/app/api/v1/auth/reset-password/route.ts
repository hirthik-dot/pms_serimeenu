import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { validateCsrfOrigin } from '@/lib/auth/csrf';
import { sanitizeObject } from '@/lib/auth/sanitize';
import { ValidationError } from '@/lib/errors';
import { authService } from '@/services/auth/auth.service';
import { validatePasswordStrength } from '@/services/auth/password.service';
import { resetPasswordSchema } from '@/validators/auth.validator';

export const POST = withApiHandler(async (request: NextRequest) => {
  validateCsrfOrigin(request);

  const body = sanitizeObject(await parseJsonBody(request, resetPasswordSchema));

  if (!validatePasswordStrength(body.password)) {
    throw new ValidationError('Password does not meet requirements');
  }

  await authService.resetPassword(body.token, body.password);

  return successResponse(null, 'Password reset successfully');
});
