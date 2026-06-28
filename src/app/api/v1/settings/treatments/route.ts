import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody, parseSearchParams } from '@/lib/api-handler';
import { createdResponse, successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { clinicSettingsService } from '@/services/clinic-settings.service';
import {
  createTreatmentAdminSchema,
  listTreatmentsAdminSchema,
} from '@/validators/settings.validator';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'settings:read');
    const query = parseSearchParams(request, listTreatmentsAdminSchema);
    const result = await clinicSettingsService.listTreatments(query);
    return successResponse(result, 'Treatments fetched');
  }, { permissions: ['settings:read'] }),
);

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'settings:manage');
    const body = await parseJsonBody(request, createTreatmentAdminSchema);
    const treatment = await clinicSettingsService.createTreatment(body, auth.userId);
    return createdResponse(treatment, 'Treatment created');
  }, { permissions: ['settings:manage'] }),
);
