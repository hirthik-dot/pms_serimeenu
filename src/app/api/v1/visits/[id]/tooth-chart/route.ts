import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { createdResponse, successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { toothChartService } from '@/services/tooth-chart.service';
import { initToothChartSchema } from '@/validators/tooth-chart.validator';

export const GET = withApiHandler(
  withAuth(async (_request: NextRequest, context, _auth) => {
    requirePermission(_auth, 'tooth-chart:read');
    const { id } = await context.params;
    if (!id) throw new Error('Visit ID is required');
    const chart = await toothChartService.getChart(id);
    return successResponse(chart, chart ? 'Tooth chart fetched successfully' : 'No tooth chart found');
  }, { permissions: ['tooth-chart:read'] }),
);

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'tooth-chart:create');
    const { id } = await context.params;
    if (!id) throw new Error('Visit ID is required');
    const body = await parseJsonBody(request, initToothChartSchema);
    const chart = await toothChartService.initializeChart(id, body, auth, body.dentitionType);
    return createdResponse(chart, 'Tooth chart initialized successfully');
  }, { permissions: ['tooth-chart:create'] }),
);
