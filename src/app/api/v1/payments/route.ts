import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { createdResponse } from '@/lib/api-response';
import { withAuth } from '@/lib/auth/api-guard';
import { ForbiddenError } from '@/lib/errors';
import { billService } from '@/services/bill.service';
import { hasAnyPermission } from '@/services/auth/permission.service';
import { createPaymentSchema } from '@/validators/billing.validator';

const PAYMENT_PERMISSIONS = ['payments:create', 'billing:create', 'billing:update'];

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    if (!hasAnyPermission(auth.permissions, PAYMENT_PERMISSIONS)) {
      throw new ForbiddenError();
    }
    const body = await parseJsonBody(request, createPaymentSchema);
    const payment = await billService.recordPayment(body, auth);
    return createdResponse(payment, 'Payment recorded successfully');
  }, { permissions: PAYMENT_PERMISSIONS }),
);
