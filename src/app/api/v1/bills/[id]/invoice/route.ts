import type { NextRequest } from 'next/server';

import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { billService } from '@/services/bill.service';

export const GET = withApiHandler(
  withAuth(async (_request: NextRequest, context, auth) => {
    requirePermission(auth, 'billing:read');
    const { id } = await context.params;
    if (!id) throw new Error('Bill ID is required');
    const invoice = await billService.getInvoice(id);
    return successResponse(invoice, 'Invoice fetched successfully');
  }, { permissions: ['billing:read'] }),
);
