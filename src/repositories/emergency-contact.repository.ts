import { Types, type ClientSession } from 'mongoose';

import { EmergencyContactModel } from '@/models/emergency-contact.model';
import { BaseRepository } from '@/repositories/base.repository';
import type { IEmergencyContactRecord } from '@/types/models';

export class EmergencyContactRepository extends BaseRepository<IEmergencyContactRecord> {
  constructor() {
    super(EmergencyContactModel);
  }

  async findByPatientId(patientId: string): Promise<IEmergencyContactRecord | null> {
    return this.findOne({
      patientId: new Types.ObjectId(patientId),
      isDeleted: false,
    } as never);
  }

  async upsertForPatient(
    patientId: string,
    data: { name: string; relationship: string; phone: string },
    session?: ClientSession,
  ): Promise<IEmergencyContactRecord> {
    const existing = await this.findByPatientId(patientId);

    if (existing) {
      const id = (existing as IEmergencyContactRecord & { _id: Types.ObjectId })._id.toString();
      return this.updateWithAudit(
        id,
        { $set: data },
        undefined,
        'Emergency contact',
        session,
      );
    }

    const doc = await EmergencyContactModel.create(
      [{ patientId: new Types.ObjectId(patientId), ...data, isDeleted: false }],
      { session },
    );
    return doc[0]!.toObject() as IEmergencyContactRecord;
  }
}

export const emergencyContactRepository = new EmergencyContactRepository();
