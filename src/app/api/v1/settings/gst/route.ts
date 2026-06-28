import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { clinicSettingsService } from '@/services/clinic-settings.service';
import { updateGstSchema } from '@/validators/settings.validator';

export const PATCH = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'settings:manage');
    const body = await parseJsonBody(request, updateGstSchema);
    const settings = await clinicSettingsService.updateGst(body, auth.userId);
    return successResponse(settings, 'GST settings updated');
  }, { permissions: ['settings:manage'] }),
);
