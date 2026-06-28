import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { createdResponse, successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { visitService } from '@/services/visit.service';
import {
  createTreatmentPlanSchema,
  updateTreatmentPlanSchema,
} from '@/validators/consultation.validator';

export const GET = withApiHandler(
  withAuth(async (_request: NextRequest, context, auth) => {
    requirePermission(auth, 'consultation:read');
    const { id } = await context.params;
    if (!id) throw new Error('Visit ID is required');
    const plan = await visitService.getTreatmentPlan(id);
    return successResponse(plan, 'Treatment plan fetched successfully');
  }, { permissions: ['consultation:read'] }),
);

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'consultation:update');
    const { id } = await context.params;
    if (!id) throw new Error('Visit ID is required');
    const body = await parseJsonBody(request, createTreatmentPlanSchema);
    const plan = await visitService.createTreatmentPlan(id, body, auth);
    return createdResponse(plan, 'Treatment plan created successfully');
  }, { permissions: ['consultation:update'] }),
);

export const PATCH = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'consultation:update');
    const { id } = await context.params;
    if (!id) throw new Error('Visit ID is required');
    const body = await parseJsonBody(request, updateTreatmentPlanSchema);
    const plan = await visitService.updateTreatmentPlan(id, body, auth);
    return successResponse(plan, 'Treatment plan updated successfully');
  }, { permissions: ['consultation:update'] }),
);
