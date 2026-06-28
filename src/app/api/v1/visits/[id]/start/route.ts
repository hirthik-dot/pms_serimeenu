import type { NextRequest } from 'next/server';

import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { visitService } from '@/services/visit.service';

export const POST = withApiHandler(
  withAuth(async (_request: NextRequest, context, auth) => {
    requirePermission(auth, 'visits:update');
    const { id } = await context.params;
    if (!id) throw new Error('Visit ID is required');
    const visit = await visitService.startVisit(id, auth);
    return successResponse(visit, 'Consultation started');
  }, { permissions: ['visits:update'] }),
);
