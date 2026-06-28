import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { toothChartService } from '@/services/tooth-chart.service';
import { bulkToothUpdateSchema } from '@/validators/tooth-chart.validator';

export const PATCH = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'tooth-chart:update');
    const { id } = await context.params;
    if (!id) throw new Error('Visit ID is required');
    const body = await parseJsonBody(request, bulkToothUpdateSchema);
    const chart = await toothChartService.bulkUpdate(id, body, auth);
    return successResponse(chart, 'Tooth chart updated successfully');
  }, { permissions: ['tooth-chart:update'] }),
);
