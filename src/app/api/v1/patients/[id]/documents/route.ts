import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { withApiHandler, parseSearchParams } from '@/lib/api-handler';
import { buildPaginationMeta, paginatedResponse, successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { patientService } from '@/services/patient.service';
import { FileCategory } from '@/types/enums';
import { paginationSchema } from '@/validators/common.validator';

const uploadDocumentSchema = z.object({
  category: z.nativeEnum(FileCategory).default(FileCategory.Other),
  visitId: z.string().optional(),
});

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'patients:read');
    requirePermission(auth, 'files:read');
    const { id } = await context.params;
    if (!id) throw new Error('Patient ID is required');
    const params = parseSearchParams(request, paginationSchema);
    const result = await patientService.getDocuments(id, params.page, params.limit);
    return paginatedResponse(
      result.data,
      buildPaginationMeta(result.meta.total, result.meta.page, result.meta.limit),
      'Patient documents fetched successfully',
    );
  }, { permissions: ['patients:read', 'files:read'] }),
);

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'patients:update');
    requirePermission(auth, 'files:create');
    const { id } = await context.params;
    if (!id) throw new Error('Patient ID is required');
    const formData = await request.formData();
    const file = formData.get('file');
    const category = String(formData.get('category') ?? FileCategory.Other);
    const visitId = formData.get('visitId') ? String(formData.get('visitId')) : undefined;

    uploadDocumentSchema.parse({ category, visitId });

    if (!(file instanceof File)) {
      throw new Error('File is required');
    }

    const document = await patientService.uploadDocument(
      id,
      file,
      category,
      auth.userId,
      visitId,
    );
    return successResponse(document, 'Document uploaded successfully');
  }, { permissions: ['patients:update', 'files:create'] }),
);
