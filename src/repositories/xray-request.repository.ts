import { Types } from 'mongoose';

import { XrayRequestModel, XRAY_REQUEST_POPULATE } from '@/models/xray-request.model';
import { BaseRepository } from '@/repositories/base.repository';
import { XrayRequestStatus } from '@/types/enums';
import type { IXrayRequest } from '@/types/models';

export class XrayRequestRepository extends BaseRepository<IXrayRequest> {
  constructor() {
    super(XrayRequestModel);
  }

  async findByVisitId(visitId: string): Promise<IXrayRequest[]> {
    return XrayRequestModel.find({
      visitId: new Types.ObjectId(visitId),
      isDeleted: false,
    })
      .populate([...XRAY_REQUEST_POPULATE.list])
      .sort({ requestedAt: -1 })
      .lean<IXrayRequest[]>()
      .exec();
  }

  async findPending(): Promise<IXrayRequest[]> {
    return XrayRequestModel.find({
      status: XrayRequestStatus.Pending,
      isDeleted: false,
    })
      .populate([...XRAY_REQUEST_POPULATE.list])
      .sort({ requestedAt: 1 })
      .lean<IXrayRequest[]>()
      .exec();
  }
}

export const xrayRequestRepository = new XrayRequestRepository();
