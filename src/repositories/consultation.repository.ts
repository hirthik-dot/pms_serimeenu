import { Types } from 'mongoose';

import { PrescriptionModel, PRESCRIPTION_POPULATE } from '@/models/prescription.model';
import { TreatmentPlanModel, TREATMENT_PLAN_POPULATE } from '@/models/treatment-plan.model';
import { BaseRepository } from '@/repositories/base.repository';
import type { IPrescription, ITreatmentPlan } from '@/types/models';

export class PrescriptionRepository extends BaseRepository<IPrescription> {
  constructor() {
    super(PrescriptionModel);
  }

  async findByVisitId(visitId: string): Promise<IPrescription | null> {
    return PrescriptionModel.findOne({ visitId, isDeleted: false })
      .populate([...PRESCRIPTION_POPULATE.detail])
      .lean<IPrescription>()
      .exec();
  }

  async findByPatientId(patientId: string, limit = 20): Promise<IPrescription[]> {
    return PrescriptionModel.find({ patientId: new Types.ObjectId(patientId), isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate([...PRESCRIPTION_POPULATE.list])
      .lean<IPrescription[]>()
      .exec();
  }
}

export const prescriptionRepository = new PrescriptionRepository();

export class TreatmentPlanRepository extends BaseRepository<ITreatmentPlan> {
  constructor() {
    super(TreatmentPlanModel);
  }

  async findByVisitId(visitId: string): Promise<ITreatmentPlan | null> {
    return TreatmentPlanModel.findOne({ visitId, isDeleted: false })
      .populate([...TREATMENT_PLAN_POPULATE.detail])
      .lean<ITreatmentPlan>()
      .exec();
  }
}

export const treatmentPlanRepository = new TreatmentPlanRepository();
