import { Types, type ClientSession } from 'mongoose';

import {
  buildPatientSearchFilter,
  buildRegexSearchFilter,
  combineFilters,
  type RepositoryPaginatedResult,
  type RepositoryPaginationOptions,
} from '@/lib/db/utils';
import { PatientModel } from '@/models/patient.model';
import { BaseRepository } from '@/repositories/base.repository';
import type { IPatient } from '@/types/models';

export interface PatientFilterOptions extends RepositoryPaginationOptions {
  search?: string;
  status?: string;
  patientType?: string;
  includeDeleted?: boolean;
  dateOfBirth?: string;
}

const PATIENT_SORT_FIELDS = ['createdAt', 'lastName', 'patientId', 'updatedAt'];

export class PatientRepository extends BaseRepository<IPatient> {
  constructor() {
    super(PatientModel);
  }

  async findByPatientId(patientId: string): Promise<IPatient | null> {
    return this.findOne({
      patientId: patientId.toUpperCase(),
      isDeleted: false,
    } as never);
  }

  async findByPhone(phone: string, excludeId?: string): Promise<IPatient | null> {
    const filter: Record<string, unknown> = { phone, isDeleted: false };
    if (excludeId) {
      filter._id = { $ne: new Types.ObjectId(excludeId) };
    }
    return this.findOne(filter as never);
  }

  async search(
    options: PatientFilterOptions,
  ): Promise<RepositoryPaginatedResult<IPatient>> {
    let searchFilter = options.search
      ? buildPatientSearchFilter<IPatient>(options.search)
      : null;

    if (options.search && !searchFilter) {
      searchFilter = buildRegexSearchFilter<IPatient>(options.search, [
        'pediatricInfo.guardianName',
        'pediatricInfo.schoolName',
        'pediatricInfo.parentName',
      ]);
    } else if (options.search) {
      const guardianFilter = buildRegexSearchFilter<IPatient>(options.search, [
        'pediatricInfo.guardianName',
        'pediatricInfo.schoolName',
        'pediatricInfo.parentName',
      ]);
      if (guardianFilter) {
        searchFilter = { $or: [searchFilter, guardianFilter].filter(Boolean) } as never;
      }
    }

    const filter = combineFilters<IPatient>(
      options.includeDeleted ? {} : { isDeleted: false },
      options.status ? ({ status: options.status } as never) : null,
      options.patientType ? ({ patientType: options.patientType } as never) : null,
      options.dateOfBirth
        ? ({
            dateOfBirth: {
              $gte: new Date(`${options.dateOfBirth}T00:00:00.000Z`),
              $lt: new Date(`${options.dateOfBirth}T23:59:59.999Z`),
            },
          } as never)
        : null,
      searchFilter,
    );

    return this.findWithFilters(filter as never, {
      ...options,
      allowedSortFields: PATIENT_SORT_FIELDS,
    });
  }

  async typeaheadSearch(query: string, limit = 10): Promise<IPatient[]> {
    const filter = combineFilters<IPatient>(
      { isDeleted: false },
      buildPatientSearchFilter<IPatient>(query),
    );

    return PatientModel.find(filter)
      .select('patientId firstName lastName phone profileImage')
      .limit(Math.min(limit, 25))
      .lean<IPatient[]>()
      .exec();
  }

  async phoneExists(phone: string, excludeId?: string): Promise<boolean> {
    const existing = await this.findByPhone(phone, excludeId);
    return existing !== null;
  }

  async createPatient(data: Partial<IPatient>, session?: ClientSession): Promise<IPatient> {
    const doc = await PatientModel.create([data], { session });
    return doc[0]!.toObject() as IPatient;
  }
}

export const patientRepository = new PatientRepository();
