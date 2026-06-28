import type { NextRequest } from 'next/server';

import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { visitService } from '@/services/visit.service';
import { UserRole } from '@/types/enums';

export const GET = withApiHandler(
  withAuth(async (_request: NextRequest, _context, auth) => {
    requirePermission(auth, 'visits:read');
    const doctorId =
      auth.role === UserRole.Doctor ? auth.userId : _request.nextUrl.searchParams.get('doctorId') ?? auth.userId;
    const dashboard = await visitService.getDoctorDashboard(doctorId);
    return successResponse(dashboard, 'Doctor dashboard fetched successfully');
  }, { permissions: ['visits:read'] }),
);
