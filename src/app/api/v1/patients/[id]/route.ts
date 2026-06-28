import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { patientService } from '@/services/patient.service';
import { updatePatientSchema } from '@/validators/patient.validator';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'patients:read');
    const { id } = await context.params;
    if (!id) throw new Error('Patient ID is required');
    const includeDeleted = request.nextUrl.searchParams.get('includeDeleted') === 'true';
    const patient = await patientService.getPatient(id, includeDeleted);
    return successResponse(patient, 'Patient fetched successfully');
  }, { permissions: ['patients:read'] }),
);

export const PATCH = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'patients:update');
    const { id } = await context.params;
    if (!id) throw new Error('Patient ID is required');
    const body = await parseJsonBody(request, updatePatientSchema);
    const patient = await patientService.updatePatient(id, body, auth.userId);
    return successResponse(patient, 'Patient updated successfully');
  }, { permissions: ['patients:update'] }),
);

export const DELETE = withApiHandler(
  withAuth(async (_request, context, auth) => {
    requirePermission(auth, 'patients:delete');
    const { id } = await context.params;
    if (!id) throw new Error('Patient ID is required');
    await patientService.deletePatient(id, auth.userId);
    return successResponse(null, 'Patient deleted successfully');
  }, { permissions: ['patients:delete'] }),
);
