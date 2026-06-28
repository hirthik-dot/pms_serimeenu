import type { NextRequest } from 'next/server';

import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth } from '@/lib/auth/api-guard';
import { visitRepository } from '@/repositories/visit.repository';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest) => {
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const patientId = searchParams.get('patientId') || undefined;
    const doctorId = searchParams.get('doctorId') || undefined;

    const filter: Record<string, string> = {};
    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;

    const result = await visitRepository.findWithFilters(filter, {
      page,
      limit,
      populate: [
        { path: 'patientId', select: 'firstName lastName patientId' },
        { path: 'doctorId', select: 'firstName lastName' },
      ],
      sortBy: 'date',
      sortOrder: 'desc',
    });

    return successResponse(result);
  }, { permissions: ['reports:read'] }),
);
