import type { NextRequest } from 'next/server';

import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { reportService } from '@/services/report.service';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'reports:read');
    const data = await reportService.getExecutiveDashboard();
    return successResponse(data, 'Executive dashboard fetched');
  }, { permissions: ['reports:read'] }),
);
