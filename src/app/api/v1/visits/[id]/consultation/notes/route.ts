import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { visitService } from '@/services/visit.service';
import { clinicalNotesSchema } from '@/validators/consultation.validator';

export const PUT = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'consultation:update');
    const { id } = await context.params;
    if (!id) throw new Error('Visit ID is required');
    const body = await parseJsonBody(request, clinicalNotesSchema);
    const consultation = await visitService.updateNotes(id, body.clinicalNotes, auth);
    return successResponse(consultation, 'Clinical notes updated successfully');
  }, { permissions: ['consultation:update'] }),
);
