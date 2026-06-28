import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { billService } from '@/services/bill.service';
import { updateBillSchema } from '@/validators/billing.validator';

export const GET = withApiHandler(
  withAuth(async (_request: NextRequest, context, auth) => {
    requirePermission(auth, 'billing:read');
    const { id } = await context.params;
    if (!id) throw new Error('Bill ID is required');
    const bill = await billService.getBill(id);
    return successResponse(bill, 'Bill fetched successfully');
  }, { permissions: ['billing:read'] }),
);

export const PATCH = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'billing:update');
    const { id } = await context.params;
    if (!id) throw new Error('Bill ID is required');
    const body = await parseJsonBody(request, updateBillSchema);
    const bill = await billService.updateBill(id, body, auth);
    return successResponse(bill, 'Bill updated successfully');
  }, { permissions: ['billing:update'] }),
);
