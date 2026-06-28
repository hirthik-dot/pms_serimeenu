import { Types } from 'mongoose';

import { connectToDatabase, nextQueueTokenNumber } from '@/lib/db';
import { ConflictError } from '@/lib/errors';
import { QueueTokenModel, QUEUE_TOKEN_POPULATE } from '@/models/queue-token.model';
import { queueTokenRepository } from '@/repositories/queue-token.repository';
import type { AuthContext } from '@/types/auth';
import { QueuePriority, QueueTokenStatus } from '@/types/enums';
import type { IQueueToken } from '@/types/models';
import { toISODateString } from '@/utils/date';
import { getDocumentId } from '@/utils/mongoose';

export interface QueueTokenDto {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  visitId?: string;
  date: string;
  tokenNumber: number;
  priority: string;
  status: string;
  calledAt?: string;
}

function mapToken(token: IQueueToken): QueueTokenDto {
  const patient =
    typeof token.patientId === 'object' && token.patientId && '_id' in token.patientId
      ? token.patientId as { firstName?: string; lastName?: string }
      : null;
  const doctor =
    typeof token.doctorId === 'object' && token.doctorId && '_id' in token.doctorId
      ? token.doctorId as { firstName?: string; lastName?: string }
      : null;

  return {
    id: getDocumentId(token),
    patientId:
      typeof token.patientId === 'object' && token.patientId && '_id' in token.patientId
        ? getDocumentId(token.patientId)
        : String(token.patientId),
    patientName: patient ? `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() : undefined,
    doctorId:
      typeof token.doctorId === 'object' && token.doctorId && '_id' in token.doctorId
        ? getDocumentId(token.doctorId)
        : String(token.doctorId),
    doctorName: doctor ? `${doctor.firstName ?? ''} ${doctor.lastName ?? ''}`.trim() : undefined,
    visitId: token.visitId ? String(token.visitId) : undefined,
    date: token.date,
    tokenNumber: token.tokenNumber,
    priority: token.priority,
    status: token.status,
    calledAt: token.calledAt ? new Date(token.calledAt).toISOString() : undefined,
  };
}

class QueueService {
  private today(): string {
    return toISODateString(new Date());
  }

  async generateToken(
    input: {
      patientId: string;
      doctorId: string;
      visitId?: string;
      appointmentId?: string;
      priority?: 'normal' | 'emergency';
    },
    auth: AuthContext,
  ): Promise<QueueTokenDto> {
    await connectToDatabase();
    const date = this.today();

    const existing = await queueTokenRepository.findTodayByPatient(input.patientId, date);
    if (existing) throw new ConflictError('Patient already has a token today');

    const tokenNumber = await nextQueueTokenNumber(input.doctorId, date);

    const doc = await queueTokenRepository.createToken({
      patientId: new Types.ObjectId(input.patientId),
      doctorId: new Types.ObjectId(input.doctorId),
      visitId: input.visitId ? new Types.ObjectId(input.visitId) : undefined,
      appointmentId: input.appointmentId ? new Types.ObjectId(input.appointmentId) : undefined,
      date,
      tokenNumber,
      priority: input.priority === 'emergency' ? QueuePriority.Emergency : QueuePriority.Normal,
      status: QueueTokenStatus.Waiting,
      createdBy: new Types.ObjectId(auth.userId),
      isDeleted: false,
    });

    return mapToken(doc);
  }

  async getWaitingList(doctorId?: string): Promise<QueueTokenDto[]> {
    await connectToDatabase();
    const date = this.today();

    const filter: Record<string, unknown> = {
      date,
      isDeleted: false,
      status: { $in: [QueueTokenStatus.Waiting, QueueTokenStatus.Called] },
    };
    if (doctorId) filter.doctorId = new Types.ObjectId(doctorId);

    const tokens = await QueueTokenModel.find(filter)
      .populate([...QUEUE_TOKEN_POPULATE.waitingList])
      .sort({ priority: -1, tokenNumber: 1 })
      .lean<IQueueToken[]>()
      .exec();

    return tokens.map(mapToken);
  }

  async callNext(doctorId: string, auth: AuthContext): Promise<QueueTokenDto | null> {
    await connectToDatabase();
    const date = this.today();

    const token = await QueueTokenModel.findOne({
      doctorId: new Types.ObjectId(doctorId),
      date,
      status: QueueTokenStatus.Waiting,
      isDeleted: false,
    })
      .sort({ priority: -1, tokenNumber: 1 })
      .lean<IQueueToken>()
      .exec();

    if (!token) return null;

    const updated = await queueTokenRepository.updateWithAudit(
      getDocumentId(token),
      {
        $set: {
          status: QueueTokenStatus.Called,
          calledAt: new Date(),
          updatedBy: auth.userId,
        },
      },
      auth.userId,
      'Queue token',
    );

    const populated = await queueTokenRepository.findByIdWithDetails(getDocumentId(updated));
    return populated ? mapToken(populated) : mapToken(updated);
  }

  async skip(tokenId: string, auth: AuthContext): Promise<QueueTokenDto> {
    await connectToDatabase();
    const updated = await queueTokenRepository.updateWithAudit(
      tokenId,
      { $set: { status: QueueTokenStatus.Skipped, updatedBy: auth.userId } },
      auth.userId,
      'Queue token',
    );
    return mapToken(updated);
  }

  async recall(tokenId: string, auth: AuthContext): Promise<QueueTokenDto> {
    await connectToDatabase();
    const updated = await queueTokenRepository.updateWithAudit(
      tokenId,
      {
        $set: {
          status: QueueTokenStatus.Called,
          calledAt: new Date(),
          updatedBy: auth.userId,
        },
      },
      auth.userId,
      'Queue token',
    );
    return mapToken(updated);
  }

  async complete(tokenId: string, auth: AuthContext): Promise<QueueTokenDto> {
    await connectToDatabase();
    const updated = await queueTokenRepository.updateWithAudit(
      tokenId,
      { $set: { status: QueueTokenStatus.Completed, updatedBy: auth.userId } },
      auth.userId,
      'Queue token',
    );
    return mapToken(updated);
  }
}

export const queueService = new QueueService();
