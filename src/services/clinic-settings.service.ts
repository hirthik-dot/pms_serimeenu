import { Types } from 'mongoose';
import type { z } from 'zod';

import { connectToDatabase } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';
import { AuditLogModel } from '@/models/audit-log.model';
import { ClinicSettingsModel } from '@/models/clinic-settings.model';
import { MedicineModel } from '@/models/medicine.model';
import { TreatmentModel } from '@/models/treatment.model';
import type { IClinicSettings, IMedicine, ITreatment } from '@/types/models';
import { getDocumentId } from '@/utils/mongoose';
import {
  type createMedicineAdminSchema,
  type createTreatmentAdminSchema,
  type listAuditLogsSchema,
  type listMedicinesAdminSchema,
  type listTreatmentsAdminSchema,
  type updateBrandingSchema,
  type updateClinicSchema,
  type updateGstSchema,
  type updateMedicineAdminSchema,
  type updateTreatmentAdminSchema,
} from '@/validators/settings.validator';

type UpdateClinicSchema = z.infer<typeof updateClinicSchema>;
type UpdateBrandingSchema = z.infer<typeof updateBrandingSchema>;
type UpdateGstSchema = z.infer<typeof updateGstSchema>;
type ListTreatmentsAdminSchema = z.infer<typeof listTreatmentsAdminSchema>;
type CreateTreatmentAdminSchema = z.infer<typeof createTreatmentAdminSchema>;
type UpdateTreatmentAdminSchema = z.infer<typeof updateTreatmentAdminSchema>;
type ListMedicinesAdminSchema = z.infer<typeof listMedicinesAdminSchema>;
type CreateMedicineAdminSchema = z.infer<typeof createMedicineAdminSchema>;
type UpdateMedicineAdminSchema = z.infer<typeof updateMedicineAdminSchema>;
type ListAuditLogsSchema = z.infer<typeof listAuditLogsSchema>;

class ClinicSettingsService {
  async getClinic(): Promise<IClinicSettings> {
    await connectToDatabase();
    let settings = await ClinicSettingsModel.findOne({ isDeleted: false }).lean<IClinicSettings>().exec();
    if (!settings) {
      const doc = await ClinicSettingsModel.create({
        clinicName: 'Smile Dental Hospital',
        phone: '+91 9876543210',
        email: 'info@smiledental.com',
        address: {
          street: '123 Health Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India',
        },
        isDeleted: false,
      });
      settings = doc.toObject() as IClinicSettings;
    }
    return settings;
  }

  async updateClinic(input: UpdateClinicSchema, userId: string): Promise<IClinicSettings> {
    await connectToDatabase();
    const settings = await this.getClinic();
    const updated = await ClinicSettingsModel.findByIdAndUpdate(
      getDocumentId(settings),
      { $set: { ...input, updatedBy: userId } },
      { new: true, runValidators: true },
    )
      .lean<IClinicSettings>()
      .exec();
    return updated!;
  }

  async updateBranding(input: UpdateBrandingSchema, userId: string): Promise<IClinicSettings> {
    await connectToDatabase();
    const settings = await this.getClinic();
    const updated = await ClinicSettingsModel.findByIdAndUpdate(
      getDocumentId(settings),
      { $set: { ...input, updatedBy: userId } },
      { new: true, runValidators: true },
    )
      .lean<IClinicSettings>()
      .exec();
    return updated!;
  }

  async updateGst(input: UpdateGstSchema, userId: string): Promise<IClinicSettings> {
    await connectToDatabase();
    const settings = await this.getClinic();
    const updated = await ClinicSettingsModel.findByIdAndUpdate(
      getDocumentId(settings),
      { $set: { ...input, updatedBy: userId } },
      { new: true, runValidators: true },
    )
      .lean<IClinicSettings>()
      .exec();
    return updated!;
  }

  async listTreatments(input: ListTreatmentsAdminSchema) {
    await connectToDatabase();
    const filter: Record<string, unknown> = { isDeleted: false };
    if (input.category) filter.category = input.category;
    if (input.isActive !== undefined) filter.isActive = input.isActive;
    if (input.search) {
      filter.$text = { $search: input.search };
    }

    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      TreatmentModel.find(filter).sort({ procedureName: 1 }).skip(skip).limit(limit).lean<ITreatment[]>().exec(),
      TreatmentModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async createTreatment(input: CreateTreatmentAdminSchema, userId: string): Promise<ITreatment> {
    await connectToDatabase();
    const doc = await TreatmentModel.create({
      ...input,
      createdBy: new Types.ObjectId(userId),
      isDeleted: false,
    });
    return doc.toObject() as ITreatment;
  }

  async updateTreatment(id: string, input: UpdateTreatmentAdminSchema, userId: string): Promise<ITreatment> {
    await connectToDatabase();
    const updated = await TreatmentModel.findByIdAndUpdate(
      id,
      { $set: { ...input, updatedBy: userId } },
      { new: true, runValidators: true },
    )
      .lean<ITreatment>()
      .exec();
    if (!updated) throw new NotFoundError('Treatment');
    return updated;
  }

  async deleteTreatment(id: string, userId: string): Promise<void> {
    await connectToDatabase();
    await TreatmentModel.findByIdAndUpdate(id, {
      $set: { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
    }).exec();
  }

  async listMedicines(input: ListMedicinesAdminSchema) {
    await connectToDatabase();
    const filter: Record<string, unknown> = { isDeleted: false };
    if (input.search) {
      filter.$or = [
        { name: { $regex: input.search, $options: 'i' } },
        { genericName: { $regex: input.search, $options: 'i' } },
      ];
    }

    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      MedicineModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean<IMedicine[]>().exec(),
      MedicineModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async createMedicine(input: CreateMedicineAdminSchema, userId: string): Promise<IMedicine> {
    await connectToDatabase();
    const doc = await MedicineModel.create({
      ...input,
      createdBy: new Types.ObjectId(userId),
      isDeleted: false,
    });
    return doc.toObject() as IMedicine;
  }

  async updateMedicine(id: string, input: UpdateMedicineAdminSchema, userId: string): Promise<IMedicine> {
    await connectToDatabase();
    const updated = await MedicineModel.findByIdAndUpdate(
      id,
      { $set: { ...input, updatedBy: userId } },
      { new: true, runValidators: true },
    )
      .lean<IMedicine>()
      .exec();
    if (!updated) throw new NotFoundError('Medicine');
    return updated;
  }

  async listAuditLogs(input: ListAuditLogsSchema) {
    await connectToDatabase();
    const filter: Record<string, unknown> = {};
    if (input.resource) filter.resource = input.resource;
    if (input.action) filter.action = input.action;
    if (input.userId) filter.userId = new Types.ObjectId(input.userId);
    if (input.dateFrom || input.dateTo) {
      const createdAt: Record<string, Date> = {};
      if (input.dateFrom) createdAt.$gte = new Date(input.dateFrom);
      if (input.dateTo) createdAt.$lte = new Date(input.dateTo);
      filter.createdAt = createdAt;
    }

    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      AuditLogModel.find(filter)
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      AuditLogModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }
}

export const clinicSettingsService = new ClinicSettingsService();
