import type { NextRequest } from 'next/server';

import { withApiHandler, parseSearchParams } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { patientService } from '@/services/patient.service';
import { patientSearchSchema } from '@/validators/patient.validator';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'patients:read');
    const params = parseSearchParams(request, patientSearchSchema);
    const results = await patientService.searchPatients(params.q, params.limit);
    return successResponse(results, 'Patients found');
  }, { permissions: ['patients:read'] }),
);
