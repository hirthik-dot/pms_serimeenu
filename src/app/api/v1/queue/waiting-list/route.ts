import type { NextRequest } from 'next/server';

import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { queueService } from '@/services/queue.service';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'queue:read');
    const doctorId = request.nextUrl.searchParams.get('doctorId');
    const list = await queueService.getWaitingList(doctorId ?? undefined);
    return successResponse(list, 'Waiting list fetched');
  }, { permissions: ['queue:read'] }),
);
