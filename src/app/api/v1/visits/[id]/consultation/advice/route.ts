import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { visitService } from '@/services/visit.service';
import { adviceSchema } from '@/validators/consultation.validator';

export const PUT = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'consultation:update');
    const { id } = await context.params;
    if (!id) throw new Error('Visit ID is required');
    const body = await parseJsonBody(request, adviceSchema);
    const consultation = await visitService.updateAdvice(id, body.advice, auth);
    return successResponse(consultation, 'Advice updated successfully');
  }, { permissions: ['consultation:update'] }),
);
