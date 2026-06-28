import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { withApiHandler, parseSearchParams } from '@/lib/api-handler';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { patientService } from '@/services/patient.service';
import { listPatientsSchema } from '@/validators/patient.validator';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'patients:read');
    requirePermission(auth, 'export:read');
    const params = parseSearchParams(request, listPatientsSchema);
    const csv = await patientService.exportPatients(params);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="patients-export.csv"',
      },
    });
  }, { permissions: ['patients:read', 'export:read'] }),
);
