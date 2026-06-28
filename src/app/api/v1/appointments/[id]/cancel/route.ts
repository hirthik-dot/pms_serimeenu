import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { appointmentService } from '@/services/appointment.service';
import { cancelAppointmentSchema } from '@/validators/appointment.validator';

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'appointments:update');
    const { id } = await context.params;
    if (!id) throw new Error('Appointment ID is required');
    const body = await parseJsonBody(request, cancelAppointmentSchema);
    const appointment = await appointmentService.cancel(id, body, auth);
    return successResponse(appointment, 'Appointment cancelled');
  }, { permissions: ['appointments:update'] }),
);
