import type { NextRequest } from 'next/server';

import { withApiHandler, parseSearchParams } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { clinicSettingsService } from '@/services/clinic-settings.service';
import { listAuditLogsSchema } from '@/validators/settings.validator';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'audit:read');
    const query = parseSearchParams(request, listAuditLogsSchema);
    const result = await clinicSettingsService.listAuditLogs(query);
    return successResponse(result, 'Audit logs fetched');
  }, { permissions: ['audit:read'] }),
);
