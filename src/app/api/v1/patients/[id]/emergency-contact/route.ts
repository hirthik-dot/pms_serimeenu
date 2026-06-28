import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { sanitizeObject } from '@/lib/auth/sanitize';
import { patientService } from '@/services/patient.service';
import { emergencyContactSchema } from '@/validators/models.validator';

export const PATCH = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'patients:update');
    const { id } = await context.params;
    if (!id) throw new Error('Patient ID is required');
    const body = sanitizeObject(await parseJsonBody(request, emergencyContactSchema));
    const contact = await patientService.updateEmergencyContact(id, body);
    return successResponse(contact, 'Emergency contact updated successfully');
  }, { permissions: ['patients:update'] }),
);
