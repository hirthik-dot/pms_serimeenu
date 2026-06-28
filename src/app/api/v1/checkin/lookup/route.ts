import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { checkinService } from '@/services/checkin.service';
import { checkinLookupSchema } from '@/validators/patient.validator';

export const POST = withApiHandler(async (request: NextRequest) => {
  const body = await parseJsonBody(request, checkinLookupSchema);
  const result = await checkinService.lookupByPhone(body.phone);
  return successResponse(result, result.found ? 'Patient found' : 'Patient not found');
});
