import type { NextRequest } from 'next/server';

import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { patientService } from '@/services/patient.service';

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'patients:update');
    const { id } = await context.params;
    if (!id) throw new Error('Patient ID is required');
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      throw new Error('File is required');
    }

    const result = await patientService.uploadProfilePhoto(id, file);
    return successResponse(result, 'Profile photo uploaded successfully');
  }, { permissions: ['patients:update'] }),
);

export const DELETE = withApiHandler(
  withAuth(async (_request, context, auth) => {
    requirePermission(auth, 'patients:update');
    const { id } = await context.params;
    if (!id) throw new Error('Patient ID is required');
    await patientService.deleteProfilePhoto(id);
    return successResponse(null, 'Profile photo removed successfully');
  }, { permissions: ['patients:update'] }),
);
