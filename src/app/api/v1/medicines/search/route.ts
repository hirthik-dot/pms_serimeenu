import type { NextRequest } from 'next/server';

import { withApiHandler, parseSearchParams } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { visitService } from '@/services/visit.service';
import { medicineSearchSchema } from '@/validators/consultation.validator';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'prescriptions:read');
    const params = parseSearchParams(request, medicineSearchSchema);
    const medicines = await visitService.searchMedicines(params.q, params.limit);
    return successResponse(medicines, 'Medicines fetched successfully');
  }, { permissions: ['prescriptions:read'] }),
);
