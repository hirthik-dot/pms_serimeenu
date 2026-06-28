import { Types, type ClientSession } from 'mongoose';

import { MedicalHistoryModel } from '@/models/medical-history.model';
import { BaseRepository } from '@/repositories/base.repository';
import type { IMedicalHistory } from '@/types/models';

export class MedicalHistoryRepository extends BaseRepository<IMedicalHistory> {
  constructor() {
    super(MedicalHistoryModel);
  }

  async findByPatientId(patientId: string): Promise<IMedicalHistory | null> {
    return this.findOne({
      patientId: new Types.ObjectId(patientId),
      isDeleted: false,
    } as never);
  }

  async upsertForPatient(
    patientId: string,
    data: Partial<IMedicalHistory>,
    session?: ClientSession,
  ): Promise<IMedicalHistory> {
    const existing = await this.findByPatientId(patientId);

    if (existing) {
      const id = (existing as IMedicalHistory & { _id: Types.ObjectId })._id.toString();
      return this.updateWithAudit(
        id,
        {
          $set: data,
          $inc: { version: 1 },
        },
        undefined,
        'Medical history',
        session,
      );
    }

    const doc = await MedicalHistoryModel.create(
      [
        {
          patientId: new Types.ObjectId(patientId),
          conditions: data.conditions ?? [],
          pastSurgeries: data.pastSurgeries ?? [],
          currentMedications: data.currentMedications ?? [],
          allergies: data.allergies ?? [],
          familyHistory: data.familyHistory,
          habits: data.habits ?? { smoking: false, alcohol: false, tobacco: false },
          notes: data.notes,
          isDeleted: false,
        },
      ],
      { session },
    );
    return doc[0]!.toObject() as IMedicalHistory;
  }
}

export const medicalHistoryRepository = new MedicalHistoryRepository();
