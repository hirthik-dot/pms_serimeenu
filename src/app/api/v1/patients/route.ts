import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody, parseSearchParams } from '@/lib/api-handler';
import { buildPaginationMeta, createdResponse, paginatedResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { sanitizeObject } from '@/lib/auth/sanitize';
import { patientService } from '@/services/patient.service';
import { createPatientSchema, listPatientsSchema } from '@/validators/patient.validator';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'patients:read');
    const params = parseSearchParams(request, listPatientsSchema);
    const result = await patientService.listPatients(params);
    return paginatedResponse(
      result.data,
      buildPaginationMeta(result.total, result.page, result.limit),
      'Patients fetched successfully',
    );
  }, { permissions: ['patients:read'] }),
);

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'patients:create');
    const body = sanitizeObject(await parseJsonBody(request, createPatientSchema));
    const patient = await patientService.createPatient(body, auth.userId);
    return createdResponse(patient, 'Patient created successfully');
  }, { permissions: ['patients:create'] }),
);
