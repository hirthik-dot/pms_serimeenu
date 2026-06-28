import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { visitService } from '@/services/visit.service';
import { cancelVisitSchema } from '@/validators/consultation.validator';

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'visits:update');
    const { id } = await context.params;
    if (!id) throw new Error('Visit ID is required');
    const body = await parseJsonBody(request, cancelVisitSchema);
    const visit = await visitService.cancelVisit(id, body.reason, auth);
    return successResponse(visit, 'Visit cancelled successfully');
  }, { permissions: ['visits:update'] }),
);
