import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { queueService } from '@/services/queue.service';
import { queueActionSchema } from '@/validators/appointment.validator';

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'queue:update');
    const body = await parseJsonBody(request, queueActionSchema);
    if (!body.doctorId) throw new Error('Doctor ID is required');
    const token = await queueService.callNext(body.doctorId, auth);
    return successResponse(token, token ? 'Patient called' : 'No patients waiting');
  }, { permissions: ['queue:update'] }),
);
