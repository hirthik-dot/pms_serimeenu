import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody, parseSearchParams } from '@/lib/api-handler';
import { createdResponse, successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { appointmentService } from '@/services/appointment.service';
import { createAppointmentSchema, listAppointmentsSchema } from '@/validators/appointment.validator';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'appointments:read');
    const query = parseSearchParams(request, listAppointmentsSchema);
    const result = await appointmentService.list(query);
    return successResponse(result, 'Appointments fetched successfully');
  }, { permissions: ['appointments:read'] }),
);

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'appointments:create');
    const body = await parseJsonBody(request, createAppointmentSchema);
    const appointment = await appointmentService.create(body, auth);
    return createdResponse(appointment, 'Appointment created successfully');
  }, { permissions: ['appointments:create'] }),
);
