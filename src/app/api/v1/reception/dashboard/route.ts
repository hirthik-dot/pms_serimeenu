import type { NextRequest } from 'next/server';

import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { appointmentService } from '@/services/appointment.service';
import { billService } from '@/services/bill.service';
import { queueService } from '@/services/queue.service';
import { reportService } from '@/services/report.service';

export const GET = withApiHandler(
  withAuth(async (_request: NextRequest, _context, auth) => {
    requirePermission(auth, 'appointments:read');
    const [executive, upcoming, queue, outstanding] = await Promise.all([
      reportService.getExecutiveDashboard(),
      appointmentService.upcoming(undefined, undefined, 1),
      queueService.getWaitingList(),
      billService.getOutstanding({ page: 1, limit: 5, sortOrder: 'desc' }),
    ]);
    return successResponse({
      stats: executive,
      todayAppointments: upcoming,
      waitingQueue: queue,
      outstandingBills: outstanding.data,
    }, 'Reception dashboard fetched');
  }, { permissions: ['appointments:read'] }),
);
