import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { createdResponse, successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { visitService } from '@/services/visit.service';
import { xrayRequestSchema } from '@/validators/consultation.validator';

export const GET = withApiHandler(
  withAuth(async (_request: NextRequest, context, auth) => {
    requirePermission(auth, 'xrays:read');
    const { id } = await context.params;
    if (!id) throw new Error('Visit ID is required');
    const requests = await visitService.getXrayRequests(id);
    return successResponse(requests, 'X-ray requests fetched successfully');
  }, { permissions: ['xrays:read'] }),
);

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'xrays:create');
    const { id } = await context.params;
    if (!id) throw new Error('Visit ID is required');
    const body = await parseJsonBody(request, xrayRequestSchema);
    const xrayRequest = await visitService.createXrayRequest(id, body, auth);
    return createdResponse(xrayRequest, 'X-ray request submitted successfully');
  }, { permissions: ['xrays:create'] }),
);
