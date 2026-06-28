import { Types, type ClientSession } from 'mongoose';

import {
  combineFilters,
  type RepositoryPaginatedResult,
  type RepositoryPaginationOptions,
} from '@/lib/db/utils';
import { FileModel, FILE_POPULATE } from '@/models/file.model';
import { BaseRepository } from '@/repositories/base.repository';
import type { IFile } from '@/types/models';

export interface FileFilterOptions extends RepositoryPaginationOptions {
  patientId?: string;
  visitId?: string;
  category?: string;
  includeDeleted?: boolean;
}

const FILE_SORT_FIELDS = ['createdAt', 'fileName', 'category'];

export class FileRepository extends BaseRepository<IFile> {
  constructor() {
    super(FileModel);
  }

  async findByPatient(
    patientId: string,
    options: FileFilterOptions = {},
  ): Promise<RepositoryPaginatedResult<IFile>> {
    const filter = combineFilters<IFile>(
      { patientId: new Types.ObjectId(patientId) },
      options.visitId ? { visitId: new Types.ObjectId(options.visitId) } : null,
      options.category ? ({ category: options.category } as never) : null,
    );

    return this.findWithFilters(filter as never, {
      ...options,
      allowedSortFields: FILE_SORT_FIELDS,
      populate: [...FILE_POPULATE.list],
    });
  }

  async createFile(data: Partial<IFile>, session?: ClientSession): Promise<IFile> {
    const doc = await FileModel.create([data], { session });
    return doc[0]!.toObject() as IFile;
  }
}

export const fileRepository = new FileRepository();
