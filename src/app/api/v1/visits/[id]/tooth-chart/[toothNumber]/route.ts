import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { toothChartService } from '@/services/tooth-chart.service';
import { toothEntryUpdateSchema } from '@/validators/tooth-chart.validator';

export const PATCH = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'tooth-chart:update');
    const { id, toothNumber: toothNumberParam } = await context.params;
    if (!id) throw new Error('Visit ID is required');
    if (!toothNumberParam) throw new Error('Tooth number is required');

    const toothNumber = Number.parseInt(toothNumberParam, 10);
    if (Number.isNaN(toothNumber)) {
      throw new Error('Invalid tooth number');
    }

    const body = await parseJsonBody(request, toothEntryUpdateSchema);
    const chart = await toothChartService.updateTooth(id, toothNumber, body, auth);
    return successResponse(chart, 'Tooth updated successfully');
  }, { permissions: ['tooth-chart:update'] }),
);
