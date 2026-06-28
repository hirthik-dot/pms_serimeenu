import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { billService } from '@/services/bill.service';
import { refundPaymentSchema } from '@/validators/billing.validator';

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'payments:delete');
    const { id } = await context.params;
    if (!id) throw new Error('Payment ID is required');
    const body = await parseJsonBody(request, refundPaymentSchema);
    const refund = await billService.refundPayment(id, body, auth);
    return successResponse(refund, 'Refund processed successfully');
  }, { permissions: ['payments:delete'] }),
);
