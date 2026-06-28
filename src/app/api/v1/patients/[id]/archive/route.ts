import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { patientService } from '@/services/patient.service';

export const POST = withApiHandler(
  withAuth(async (_request, context, auth) => {
    requirePermission(auth, 'patients:update');
    const { id } = await context.params;
    if (!id) throw new Error('Patient ID is required');
    const patient = await patientService.archivePatient(id, auth.userId);
    return successResponse(patient, 'Patient archived successfully');
  }, { permissions: ['patients:update'] }),
);
