import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { createdResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { billService } from '@/services/bill.service';
import { splitPaymentSchema } from '@/validators/billing.validator';

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'payments:create');
    const body = await parseJsonBody(request, splitPaymentSchema);
    const payments = await billService.splitPayment(body, auth);
    return createdResponse(payments, 'Split payment recorded successfully');
  }, { permissions: ['payments:create'] }),
);
