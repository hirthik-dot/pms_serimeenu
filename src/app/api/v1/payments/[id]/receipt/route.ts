import type { NextRequest } from 'next/server';

import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { billService } from '@/services/bill.service';

export const GET = withApiHandler(
  withAuth(async (_request: NextRequest, context, auth) => {
    requirePermission(auth, 'payments:read');
    const { id } = await context.params;
    if (!id) throw new Error('Payment ID is required');
    const receipt = await billService.getReceipt(id);
    return successResponse(receipt, 'Receipt fetched successfully');
  }, { permissions: ['payments:read'] }),
);
