import type { NextRequest } from 'next/server';

import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { appointmentService } from '@/services/appointment.service';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'appointments:read');
    const doctorId = request.nextUrl.searchParams.get('doctorId');
    const patientId = request.nextUrl.searchParams.get('patientId');
    const days = Number.parseInt(request.nextUrl.searchParams.get('days') ?? '7', 10);
    const appointments = await appointmentService.upcoming(
      doctorId ?? undefined,
      patientId ?? undefined,
      days,
    );
    return successResponse(appointments, 'Upcoming appointments fetched');
  }, { permissions: ['appointments:read'] }),
);
