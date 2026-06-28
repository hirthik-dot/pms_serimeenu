import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { sanitizeObject } from '@/lib/auth/sanitize';
import { patientService } from '@/services/patient.service';
import { mergePatientsSchema } from '@/validators/patient.validator';

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'patients:update');
    const body = sanitizeObject(await parseJsonBody(request, mergePatientsSchema));
    const patient = await patientService.mergePatients(
      body.primaryPatientId,
      body.duplicatePatientId,
      auth.userId,
    );
    return successResponse(patient, 'Patients merged successfully');
  }, { permissions: ['patients:update'] }),
);
