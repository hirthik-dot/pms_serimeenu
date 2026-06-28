import type { NextRequest } from 'next/server';

import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { visitService } from '@/services/visit.service';

export const GET = withApiHandler(
  withAuth(async (_request: NextRequest, context, auth) => {
    requirePermission(auth, 'visits:read');
    const { id } = await context.params;
    if (!id) throw new Error('Visit ID is required');
    const visit = await visitService.getVisit(id);
    return successResponse(visit, 'Visit fetched successfully');
  }, { permissions: ['visits:read'] }),
);
