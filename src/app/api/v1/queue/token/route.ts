import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { createdResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { queueService } from '@/services/queue.service';
import { queueTokenSchema } from '@/validators/appointment.validator';

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'queue:create');
    const body = await parseJsonBody(request, queueTokenSchema);
    const token = await queueService.generateToken(body, auth);
    return createdResponse(token, 'Queue token generated');
  }, { permissions: ['queue:create'] }),
);
