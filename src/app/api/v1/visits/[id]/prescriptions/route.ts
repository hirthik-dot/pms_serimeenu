import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { createdResponse, successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { visitService } from '@/services/visit.service';
import { createPrescriptionSchema } from '@/validators/consultation.validator';

export const GET = withApiHandler(
  withAuth(async (_request: NextRequest, context, auth) => {
    requirePermission(auth, 'prescriptions:read');
    const { id } = await context.params;
    if (!id) throw new Error('Visit ID is required');
    const prescription = await visitService.getPrescription(id);
    return successResponse(prescription, 'Prescription fetched successfully');
  }, { permissions: ['prescriptions:read'] }),
);

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'prescriptions:create');
    const { id } = await context.params;
    if (!id) throw new Error('Visit ID is required');
    const body = await parseJsonBody(request, createPrescriptionSchema);
    const prescription = await visitService.savePrescription(id, body, auth);
    return createdResponse(prescription, 'Prescription saved successfully');
  }, { permissions: ['prescriptions:create'] }),
);
