import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { createdResponse } from '@/lib/api-response';
import { checkinService } from '@/services/checkin.service';
import { checkinSubmitSchema } from '@/validators/patient.validator';

export const POST = withApiHandler(async (request: NextRequest) => {
  const body = await parseJsonBody(request, checkinSubmitSchema);
  const result = await checkinService.submitCheckin(body);
  return createdResponse(result, result.message);
});
