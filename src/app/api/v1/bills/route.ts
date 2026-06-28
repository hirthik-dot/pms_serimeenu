import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody, parseSearchParams } from '@/lib/api-handler';
import { createdResponse, successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { billService } from '@/services/bill.service';
import { createBillSchema, listBillsSchema } from '@/validators/billing.validator';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'billing:read');
    const query = parseSearchParams(request, listBillsSchema);
    const result = await billService.listBills(query);
    return successResponse(result, 'Bills fetched successfully');
  }, { permissions: ['billing:read'] }),
);

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'billing:create');
    const body = await parseJsonBody(request, createBillSchema);
    const bill = await billService.createBill(body, auth);
    return createdResponse(bill, 'Bill created successfully');
  }, { permissions: ['billing:create'] }),
);
