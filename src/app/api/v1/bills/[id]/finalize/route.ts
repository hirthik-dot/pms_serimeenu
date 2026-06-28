import type { NextRequest } from 'next/server';

import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { billService } from '@/services/bill.service';

export const POST = withApiHandler(
  withAuth(async (_request: NextRequest, context, auth) => {
    requirePermission(auth, 'billing:update');
    const { id } = await context.params;
    if (!id) throw new Error('Bill ID is required');
    const bill = await billService.finalizeBill(id, auth);
    return successResponse(bill, 'Bill finalized successfully');
  }, { permissions: ['billing:update'] }),
);
