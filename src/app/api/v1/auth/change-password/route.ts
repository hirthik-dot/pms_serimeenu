import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth } from '@/lib/auth/api-guard';
import { sanitizeObject } from '@/lib/auth/sanitize';
import { ValidationError } from '@/lib/errors';
import { authService } from '@/services/auth/auth.service';
import {
  clearAuthCookies,
} from '@/services/auth/cookie.service';
import { validatePasswordStrength } from '@/services/auth/password.service';
import { changePasswordSchema } from '@/validators/auth.validator';

export const PATCH = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    const body = sanitizeObject(await parseJsonBody(request, changePasswordSchema));

    if (!validatePasswordStrength(body.newPassword)) {
      throw new ValidationError('Password does not meet requirements');
    }

    await authService.changePassword(
      auth.userId,
      body.currentPassword,
      body.newPassword,
    );

    const response = successResponse(null, 'Password changed successfully. Please log in again.');
    return clearAuthCookies(response);
  }),
);
