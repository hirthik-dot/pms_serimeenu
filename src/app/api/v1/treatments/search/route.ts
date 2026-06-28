import type { NextRequest } from 'next/server';

import { withApiHandler, parseSearchParams } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { visitService } from '@/services/visit.service';
import { treatmentSearchSchema } from '@/validators/consultation.validator';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'consultation:read');
    const params = parseSearchParams(request, treatmentSearchSchema);
    const treatments = await visitService.searchTreatments(params.q, params.limit);
    return successResponse(treatments, 'Treatments fetched successfully');
  }, { permissions: ['consultation:read'] }),
);
