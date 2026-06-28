import { MedicineModel } from '@/models/medicine.model';
import type { IMedicine } from '@/types/models';

export class MedicineRepository {
  async search(query: string, limit = 20): Promise<IMedicine[]> {
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    return MedicineModel.find({
      isDeleted: false,
      isActive: true,
      $or: [{ name: regex }, { genericName: regex }],
    })
      .select('name genericName defaultDosage defaultFrequency defaultRoute')
      .sort({ name: 1 })
      .limit(limit)
      .lean<IMedicine[]>()
      .exec();
  }
}

export const medicineRepository = new MedicineRepository();
