import { Types } from 'mongoose';

import {
  getTeethForDentition,
  type DentitionType,
} from '@/features/odontogram/constants/dentition';
import { connectToDatabase } from '@/lib/db';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/lib/errors';
import { ToothChartModel } from '@/models/tooth-chart.model';
import { ToothConditionModel } from '@/models/tooth-condition.model';
import { TreatmentModel } from '@/models/treatment.model';
import { toothChartRepository } from '@/repositories/tooth-chart.repository';
import { visitRepository } from '@/repositories/visit.repository';
import {
  mapToothChart,
  mapToothConditionHistory,
} from '@/services/tooth-chart.mapper';
import type { AuthContext } from '@/types/auth';
import type {
  ToothChartDto,
  ToothChartHistoryDto,
  ToothConditionHistoryItem,
} from '@/types/consultation';
import { ToothNumberingSystem, ToothStatus, VisitStatus } from '@/types/enums';
import type { IToothChart, IToothEntry, IVisit } from '@/types/models';
import { getDocumentId } from '@/utils/mongoose';
import type {
  BulkToothUpdateInput,
  InitToothChartInput,
  ToothChartHistoryQuery,
  ToothEntryUpdateInput,
  TreatmentMappingInput,
} from '@/validators/tooth-chart.validator';
import { validateToothNumberForDentition } from '@/validators/tooth-chart.validator';

class ToothChartService {
  private assertCanAccessVisit(): void {
    // Relying on RBAC permissions for authorization.
    // In a small clinic, any doctor can view/modify visits.
  }

  private async getVisitOrThrow(id: string): Promise<IVisit> {
    const visit = await visitRepository.findByIdWithDetails(id);
    if (!visit || visit.isDeleted) {
      throw new NotFoundError('Visit');
    }
    return visit;
  }

  private assertVisitEditable(visit: IVisit): void {
    if ([VisitStatus.Completed, VisitStatus.Cancelled].includes(visit.status)) {
      throw new ConflictError('Cannot modify tooth chart for a completed or cancelled visit');
    }
  }

  private resolvePatientId(visit: IVisit): string {
    return typeof visit.patientId === 'object' && '_id' in visit.patientId
      ? getDocumentId(visit.patientId)
      : String(visit.patientId);
  }

  private buildDefaultTeeth(dentition: DentitionType): IToothEntry[] {
    return getTeethForDentition(dentition).map((toothNumber) => ({
      toothNumber,
      status: ToothStatus.Healthy,
    }));
  }

  private mergeTeethFromPrevious(
    defaultTeeth: IToothEntry[],
    previousTeeth: IToothEntry[],
  ): IToothEntry[] {
    const previousMap = new Map(previousTeeth.map((t) => [t.toothNumber, t]));
    return defaultTeeth.map((tooth) => previousMap.get(tooth.toothNumber) ?? tooth);
  }

  private async recordConditionHistory(
    chart: IToothChart,
    tooth: IToothEntry,
    auth: AuthContext,
  ): Promise<void> {
    await ToothConditionModel.create({
      toothChartId: new Types.ObjectId(getDocumentId(chart)),
      visitId: chart.visitId,
      patientId: chart.patientId,
      toothNumber: tooth.toothNumber,
      status: tooth.status,
      surfaces: tooth.surfaces,
      notes: tooth.notes,
      recordedBy: new Types.ObjectId(auth.userId),
      recordedAt: new Date(),
      createdBy: new Types.ObjectId(auth.userId),
      isDeleted: false,
    });
  }

  async getChart(visitId: string): Promise<ToothChartDto | null> {
    await connectToDatabase();
    await this.getVisitOrThrow(visitId);
    const chart = await toothChartRepository.findByVisitId(visitId);
    return chart ? mapToothChart(chart) : null;
  }

  async initializeChart(
    visitId: string,
    input: InitToothChartInput,
    auth: AuthContext,
    dentitionOverride?: DentitionType,
  ): Promise<ToothChartDto> {
    await connectToDatabase();
    const visit = await this.getVisitOrThrow(visitId);
    this.assertCanAccessVisit();
    this.assertVisitEditable(visit);

    const existing = await toothChartRepository.findByVisitId(visitId);
    if (existing) {
      throw new ConflictError('Tooth chart already exists for this visit');
    }

    const patientId = this.resolvePatientId(visit);
    const patient =
      typeof visit.patientId === 'object' && '_id' in visit.patientId
        ? visit.patientId
        : null;

    const dentition =
      dentitionOverride ??
      input.dentitionType ??
      (patient && 'patientType' in patient && patient.patientType === 'pediatric'
        ? 'pediatric'
        : 'adult');

    let teeth = this.buildDefaultTeeth(dentition);

    if (input.copyFromPrevious) {
      const previous = await toothChartRepository.findLatestByPatientId(patientId, visitId);
      if (previous?.teeth?.length) {
        teeth = this.mergeTeethFromPrevious(teeth, previous.teeth);
      }
    }

    const doc = await ToothChartModel.create({
      visitId: new Types.ObjectId(visitId),
      patientId: new Types.ObjectId(patientId),
      doctorId: new Types.ObjectId(auth.userId),
      numberingSystem: input.numberingSystem,
      teeth,
      treatmentMappings: [],
      createdBy: new Types.ObjectId(auth.userId),
      isDeleted: false,
    });

    return mapToothChart(doc.toObject());
  }

  async updateTooth(
    visitId: string,
    toothNumber: number,
    input: ToothEntryUpdateInput,
    auth: AuthContext,
    dentition: DentitionType = 'adult',
  ): Promise<ToothChartDto> {
    await connectToDatabase();
    const visit = await this.getVisitOrThrow(visitId);
    this.assertCanAccessVisit();
    this.assertVisitEditable(visit);

    if (!validateToothNumberForDentition(toothNumber, dentition)) {
      throw new ValidationError(`Invalid tooth number ${toothNumber} for ${dentition} dentition`);
    }

    const chart = await toothChartRepository.findByVisitId(visitId);
    if (!chart) {
      throw new NotFoundError('Tooth chart');
    }

    const teeth = [...chart.teeth];
    const index = teeth.findIndex((t) => t.toothNumber === toothNumber);
    const existing = index >= 0 ? teeth[index]! : { toothNumber, status: ToothStatus.Healthy };

    const updated: IToothEntry = {
      ...existing,
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.surfaces !== undefined ? { surfaces: input.surfaces } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    };

    if (index >= 0) {
      teeth[index] = updated;
    } else {
      teeth.push(updated);
    }

    const saved = await toothChartRepository.updateWithAudit(
      getDocumentId(chart),
      { $set: { teeth } },
      auth.userId,
      'Tooth chart',
    );

    await this.recordConditionHistory(saved, updated, auth);

    return mapToothChart(saved);
  }

  async bulkUpdate(
    visitId: string,
    input: BulkToothUpdateInput,
    auth: AuthContext,
    dentition: DentitionType = 'adult',
  ): Promise<ToothChartDto> {
    await connectToDatabase();
    const visit = await this.getVisitOrThrow(visitId);
    this.assertCanAccessVisit();
    this.assertVisitEditable(visit);

    for (const tooth of input.teeth) {
      if (!validateToothNumberForDentition(tooth.toothNumber, dentition)) {
        throw new ValidationError(`Invalid tooth number ${tooth.toothNumber}`);
      }
    }

    const chart = await toothChartRepository.findByVisitId(visitId);
    if (!chart) {
      throw new NotFoundError('Tooth chart');
    }

    const teethMap = new Map(chart.teeth.map((t) => [t.toothNumber, { ...t }]));

    for (const update of input.teeth) {
      const existing = teethMap.get(update.toothNumber) ?? {
        toothNumber: update.toothNumber,
        status: ToothStatus.Healthy,
      };
      teethMap.set(update.toothNumber, {
        ...existing,
        ...(update.status !== undefined ? { status: update.status } : {}),
        ...(update.surfaces !== undefined ? { surfaces: update.surfaces } : {}),
        ...(update.notes !== undefined ? { notes: update.notes } : {}),
      });
    }

    const teeth = Array.from(teethMap.values());
    const saved = await toothChartRepository.updateWithAudit(
      getDocumentId(chart),
      { $set: { teeth } },
      auth.userId,
      'Tooth chart',
    );

    for (const update of input.teeth) {
      const tooth = teethMap.get(update.toothNumber);
      if (tooth) {
        await this.recordConditionHistory(saved, tooth, auth);
      }
    }

    return mapToothChart(saved);
  }

  async getHistory(
    patientId: string,
    query: ToothChartHistoryQuery,
  ): Promise<ToothChartHistoryDto> {
    await connectToDatabase();
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const result = await toothChartRepository.findHistoryByPatientId(patientId, {
      page,
      limit,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      toothNumber: query.toothNumber,
    });

    const items: ToothConditionHistoryItem[] = result.data.map(mapToothConditionHistory);

    return {
      data: items,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async addTreatmentMappings(
    visitId: string,
    input: TreatmentMappingInput,
    auth: AuthContext,
    dentition: DentitionType = 'adult',
  ): Promise<ToothChartDto> {
    await connectToDatabase();
    const visit = await this.getVisitOrThrow(visitId);
    this.assertCanAccessVisit();
    this.assertVisitEditable(visit);

    for (const mapping of input.mappings) {
      if (!validateToothNumberForDentition(mapping.toothNumber, dentition)) {
        throw new ValidationError(`Invalid tooth number ${mapping.toothNumber}`);
      }

      const treatment = await TreatmentModel.findOne({
        _id: mapping.treatmentId,
        isDeleted: false,
      }).lean();

      if (!treatment) {
        throw new ValidationError(`Invalid treatment ID: ${mapping.treatmentId}`);
      }
    }

    const chart = await toothChartRepository.findByVisitId(visitId);
    if (!chart) {
      throw new NotFoundError('Tooth chart');
    }

    const newMappings = input.mappings.map((m) => ({
      toothNumber: m.toothNumber,
      treatmentId: new Types.ObjectId(m.treatmentId),
      surfaces: m.surfaces,
    }));

    const saved = await toothChartRepository.updateWithAudit(
      getDocumentId(chart),
      { $push: { treatmentMappings: { $each: newMappings } } },
      auth.userId,
      'Tooth chart',
    );

    return mapToothChart(saved);
  }

  async getOrInitializeChart(
    visitId: string,
    auth: AuthContext,
    dentition: DentitionType,
  ): Promise<ToothChartDto> {
    const existing = await this.getChart(visitId);
    if (existing) return existing;

    return this.initializeChart(
      visitId,
      { numberingSystem: ToothNumberingSystem.FDI, copyFromPrevious: true },
      auth,
      dentition,
    );
  }
}

export const toothChartService = new ToothChartService();
