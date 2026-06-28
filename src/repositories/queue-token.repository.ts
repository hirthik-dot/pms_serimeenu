import { Types, type ClientSession } from 'mongoose';

import { QueueTokenModel, QUEUE_TOKEN_POPULATE } from '@/models/queue-token.model';
import { BaseRepository } from '@/repositories/base.repository';
import type { IQueueToken } from '@/types/models';

export class QueueTokenRepository extends BaseRepository<IQueueToken> {
  constructor() {
    super(QueueTokenModel);
  }

  async findTodayByPatient(patientId: string, date: string): Promise<IQueueToken | null> {
    return this.findOne({
      patientId: new Types.ObjectId(patientId),
      date,
      isDeleted: false,
    } as never);
  }

  async createToken(data: Partial<IQueueToken>, session?: ClientSession): Promise<IQueueToken> {
    const doc = await QueueTokenModel.create([data], { session });
    return doc[0]!.toObject() as IQueueToken;
  }

  async findByIdWithDetails(id: string): Promise<IQueueToken | null> {
    return QueueTokenModel.findById(id)
      .populate([...QUEUE_TOKEN_POPULATE.waitingList])
      .lean<IQueueToken>()
      .exec();
  }
}

export const queueTokenRepository = new QueueTokenRepository();
