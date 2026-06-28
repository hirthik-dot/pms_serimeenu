import type { NextRequest } from 'next/server';

import { withApiHandler, parseSearchParams } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { toothChartService } from '@/services/tooth-chart.service';
import { toothChartHistorySchema } from '@/validators/tooth-chart.validator';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, context, _auth) => {
    requirePermission(_auth, 'tooth-chart:read');
    const { id } = await context.params;
    if (!id) throw new Error('Patient ID is required');
    const query = parseSearchParams(request, toothChartHistorySchema);
    const history = await toothChartService.getHistory(id, query);
    return successResponse(history, 'Tooth chart history fetched successfully');
  }, { permissions: ['tooth-chart:read'] }),
);
