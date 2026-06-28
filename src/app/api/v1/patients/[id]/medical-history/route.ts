import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { sanitizeObject } from '@/lib/auth/sanitize';
import { patientService } from '@/services/patient.service';
import { medicalHistorySchema } from '@/validators/models.validator';

export const GET = withApiHandler(
  withAuth(async (_request, context, auth) => {
    requirePermission(auth, 'patients:read');
    const { id } = await context.params;
    if (!id) throw new Error('Patient ID is required');
    const history = await patientService.getMedicalHistory(id);
    return successResponse(history, 'Medical history fetched successfully');
  }, { permissions: ['patients:read'] }),
);

export const PUT = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'patients:update');
    const { id } = await context.params;
    if (!id) throw new Error('Patient ID is required');
    const body = sanitizeObject(await parseJsonBody(request, medicalHistorySchema));
    const history = await patientService.updateMedicalHistory(id, body);
    return successResponse(history, 'Medical history updated successfully');
  }, { permissions: ['patients:update'] }),
);
