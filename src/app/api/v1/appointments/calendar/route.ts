import type { NextRequest } from 'next/server';

import { withApiHandler, parseSearchParams } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { appointmentService } from '@/services/appointment.service';
import { calendarQuerySchema } from '@/validators/appointment.validator';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'appointments:read');
    const query = parseSearchParams(request, calendarQuerySchema);
    const appointments = await appointmentService.calendar(
      query.dateFrom,
      query.dateTo,
      query.doctorId,
    );
    return successResponse(appointments, 'Calendar appointments fetched');
  }, { permissions: ['appointments:read'] }),
);
