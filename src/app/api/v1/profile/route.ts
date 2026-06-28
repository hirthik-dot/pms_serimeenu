import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth } from '@/lib/auth/api-guard';
import { sanitizeObject } from '@/lib/auth/sanitize';
import { profileService } from '@/services/profile.service';
import { updateProfileSchema } from '@/validators/profile.validator';

export const GET = withApiHandler(
  withAuth(async (_request, _context, auth) => {
    const profile = await profileService.getProfile(auth.userId);
    return successResponse(profile, 'Profile fetched successfully');
  }),
);

export const PATCH = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    const body = sanitizeObject(await parseJsonBody(request, updateProfileSchema));
    const profile = await profileService.updateProfile(auth.userId, body);
    return successResponse(profile, 'Profile updated successfully');
  }),
);
