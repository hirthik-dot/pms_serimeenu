import type { NextRequest } from 'next/server';

import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { visitService } from '@/services/visit.service';

export const GET = withApiHandler(
  withAuth(async (_request: NextRequest, context, auth) => {
    requirePermission(auth, 'consultation:read');
    const { id } = await context.params;
    if (!id) throw new Error('Visit ID is required');
    const consultation = await visitService.getConsultation(id);
    return successResponse(consultation, 'Consultation fetched successfully');
  }, { permissions: ['consultation:read'] }),
);
