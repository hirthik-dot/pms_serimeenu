import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { clinicSettingsService } from '@/services/clinic-settings.service';
import { updateClinicSchema } from '@/validators/settings.validator';

export const GET = withApiHandler(
  withAuth(async (_request: NextRequest, _context, auth) => {
    requirePermission(auth, 'settings:read');
    const clinic = await clinicSettingsService.getClinic();
    return successResponse(clinic, 'Clinic settings fetched');
  }, { permissions: ['settings:read'] }),
);

export const PATCH = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'settings:manage');
    const body = await parseJsonBody(request, updateClinicSchema);
    const clinic = await clinicSettingsService.updateClinic(body, auth.userId);
    return successResponse(clinic, 'Clinic settings updated');
  }, { permissions: ['settings:manage'] }),
);
