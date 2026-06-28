import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { patientService } from '@/services/patient.service';

export const GET = withApiHandler(
  withAuth(async (_request, context, auth) => {
    requirePermission(auth, 'patients:read');
    const { id } = await context.params;
    if (!id) throw new Error('Patient ID is required');
    const history = await patientService.getClinicalHistory(id);
    return successResponse(history, 'Patient history fetched successfully');
  }, { permissions: ['patients:read'] }),
);
