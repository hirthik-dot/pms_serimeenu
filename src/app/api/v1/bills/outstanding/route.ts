import type { NextRequest } from 'next/server';

import { withApiHandler, parseSearchParams } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { billService } from '@/services/bill.service';
import { listBillsSchema } from '@/validators/billing.validator';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'billing:read');
    const query = parseSearchParams(request, listBillsSchema);
    const result = await billService.getOutstanding(query);
    return successResponse(result, 'Outstanding bills fetched successfully');
  }, { permissions: ['billing:read'] }),
);
