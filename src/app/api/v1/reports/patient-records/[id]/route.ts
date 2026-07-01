import type { NextRequest } from 'next/server';

import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth } from '@/lib/auth/api-guard';
import { NotFoundError } from '@/lib/errors';
import { reportService } from '@/services/report.service';

export const GET = withApiHandler(
  withAuth(async (_request: NextRequest, context) => {
    const { id } = await context.params;
    if (!id) throw new Error('Patient ID is required');

    const record = await reportService.getPatientRecordDetail(id);
    if (!record) {
      throw new NotFoundError('Patient record');
    }

    return successResponse(record);
  }, { permissions: ['reports:read'] }),
);
