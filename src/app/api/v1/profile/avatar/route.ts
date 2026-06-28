import type { NextRequest } from 'next/server';

import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth } from '@/lib/auth/api-guard';
import { profileService } from '@/services/profile.service';
import { uploadAvatar } from '@/services/upload.service';

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      throw new Error('File is required');
    }

    const avatarUrl = await uploadAvatar(file, auth.userId);
    const profile = await profileService.updateAvatar(auth.userId, avatarUrl);

    return successResponse({ avatar: profile.avatar }, 'Avatar uploaded successfully');
  }),
);
