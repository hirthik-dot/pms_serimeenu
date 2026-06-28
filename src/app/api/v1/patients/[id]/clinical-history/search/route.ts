import type { NextRequest } from 'next/server';

import { withApiHandler, parseSearchParams } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { visitService } from '@/services/visit.service';
import { clinicalHistorySearchSchema } from '@/validators/consultation.validator';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'patients:read');
    const { id } = await context.params;
    if (!id) throw new Error('Patient ID is required');
    const params = parseSearchParams(request, clinicalHistorySearchSchema);
    const history = await visitService.searchClinicalHistory(id, params.q, params.type);
    return successResponse(history, 'Clinical history fetched successfully');
  }, { permissions: ['patients:read'] }),
);
