import type { NextRequest } from 'next/server';

import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth } from '@/lib/auth/api-guard';
import { reportService } from '@/services/report.service';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest) => {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const search = searchParams.get('search') || undefined;

    const result = await reportService.getPatientRecords(page, limit, search);
    return successResponse(result);
  }, { permissions: ['reports:read'] }),
);
