import type { NextRequest } from 'next/server';

import { withApiHandler, parseSearchParams } from '@/lib/api-handler';
import { buildPaginationMeta, paginatedResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { patientService } from '@/services/patient.service';
import { patientTimelineSchema } from '@/validators/patient.validator';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'patients:read');
    const { id } = await context.params;
    if (!id) throw new Error('Patient ID is required');
    const params = parseSearchParams(request, patientTimelineSchema);
    const result = await patientService.getTimeline(id, params);
    return paginatedResponse(
      result.data,
      buildPaginationMeta(result.total, result.page, result.limit),
      'Patient timeline fetched successfully',
    );
  }, { permissions: ['patients:read'] }),
);
