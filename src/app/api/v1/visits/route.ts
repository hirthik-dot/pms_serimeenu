import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody, parseSearchParams } from '@/lib/api-handler';
import { buildPaginationMeta, createdResponse, paginatedResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { visitService } from '@/services/visit.service';
import { createVisitSchema, listVisitsSchema } from '@/validators/consultation.validator';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'visits:read');
    const params = parseSearchParams(request, listVisitsSchema);
    const result = await visitService.listVisits(params, auth);
    return paginatedResponse(
      result.data,
      buildPaginationMeta(result.total, result.page, result.limit),
      'Visits fetched successfully',
    );
  }, { permissions: ['visits:read'] }),
);

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'visits:create');
    const body = await parseJsonBody(request, createVisitSchema);
    const visit = await visitService.createVisit(body, auth);
    return createdResponse(visit, 'Visit created successfully');
  }, { permissions: ['visits:create'] }),
);
