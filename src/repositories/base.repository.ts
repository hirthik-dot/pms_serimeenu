// =============================================================================
// Base Repository (Generic CRUD)
// =============================================================================
// Abstract repository providing common data access operations.
// Domain repositories extend this with collection-specific queries.
// =============================================================================

import type mongoose from 'mongoose';
import {
  type ClientSession,
  type PopulateOptions,
  type ProjectionType,
  type QueryOptions,
  type UpdateQuery,
} from 'mongoose';

// Mongoose 9.x renamed FilterQuery → QueryFilter
type QueryFilter<T> = mongoose.QueryFilter<T>;

import { PAGINATION } from '@/constants/app';
import {
  activeOnlyFilter,
  buildPaginatedResult,
  buildSortObject,
  normalizeRepositoryPagination,
  type RepositoryPaginatedResult,
  type RepositoryPaginationOptions,
} from '@/lib/db/utils';
import { NotFoundError } from '@/lib/errors';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface FindWithFiltersOptions extends RepositoryPaginationOptions {
  includeDeleted?: boolean;
  populate?: PopulateOptions | PopulateOptions[];
  allowedSortFields?: string[];
  session?: ClientSession;
}

export interface SoftDeleteOptions {
  deletedBy?: string;
  session?: ClientSession;
}

/**
 * Generic base repository providing standard CRUD operations.
 * All domain-specific repositories extend this class.
 *
 * @typeParam T - The Mongoose document type for this collection.
 */
export class BaseRepository<T> {
  constructor(protected readonly model: mongoose.Model<T>) {}

  /**
   * Find a document by its ID.
   * Returns null if not found.
   */
  async findById(
    id: string,
    projection?: ProjectionType<T>,
  ): Promise<T | null> {
    return this.model
      .findById(id, projection)
      .lean<T>()
      .exec();
  }

  /**
   * Find a document by ID, throwing NotFoundError if not found.
   */
  async findByIdOrThrow(
    id: string,
    resourceName = 'Resource',
    projection?: ProjectionType<T>,
  ): Promise<T> {
    const doc = await this.findById(id, projection);
    if (!doc) throw new NotFoundError(resourceName);
    return doc;
  }

  /**
   * Find a single document matching the filter.
   */
  async findOne(
    filter: QueryFilter<T>,
    projection?: ProjectionType<T>,
  ): Promise<T | null> {
    return this.model
      .findOne(filter, projection)
      .lean<T>()
      .exec();
  }

  /**
   * Find all documents matching the filter.
   */
  async findMany(
    filter: QueryFilter<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ): Promise<T[]> {
    return this.model
      .find(filter, projection, options)
      .lean<T[]>()
      .exec();
  }

  /**
   * Find documents with pagination.
   */
  async findPaginated(
    filter: QueryFilter<T>,
    options: PaginationOptions = {},
    projection?: ProjectionType<T>,
  ): Promise<PaginatedResult<T>> {
    const page = options.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = options.limit ?? PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const sortField = options.sortBy ?? 'createdAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      this.model
        .find(filter, projection)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean<T[]>()
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  /**
   * Create a new document.
   */
  async create(data: Partial<T>): Promise<T> {
    const doc = await this.model.create(data);
    return doc.toObject() as unknown as T;
  }

  /**
   * Create multiple documents.
   */
  async createMany(data: Partial<T>[]): Promise<T[]> {
    const docs = await this.model.insertMany(data);
    return docs.map((doc) => (doc as unknown as { toObject: () => T }).toObject());
  }

  /**
   * Update a document by ID.
   */
  async updateById(
    id: string,
    update: UpdateQuery<T>,
    resourceName = 'Resource',
  ): Promise<T> {
    const doc = await this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .lean<T>()
      .exec();

    if (!doc) throw new NotFoundError(resourceName);
    return doc;
  }

  /**
   * Soft-delete a document by ID (sets isDeleted: true).
   */
  async softDelete(
    id: string,
    resourceName = 'Resource',
    options: SoftDeleteOptions = {},
  ): Promise<T> {
    const update: Record<string, unknown> = {
      isDeleted: true,
      deletedAt: new Date(),
    };
    if (options.deletedBy) {
      update.deletedBy = options.deletedBy;
    }

    const query = this.model.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true, session: options.session },
    );

    const doc = await query.lean<T>().exec();
    if (!doc) throw new NotFoundError(resourceName);
    return doc;
  }

  /**
   * Restore a soft-deleted document.
   */
  async restore(
    id: string,
    resourceName = 'Resource',
    restoredBy?: string,
    session?: ClientSession,
  ): Promise<T> {
    const update: Record<string, unknown> = {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    };
    if (restoredBy) {
      update.updatedBy = restoredBy;
    }

    const doc = await this.model
      .findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true, session })
      .lean<T>()
      .exec();

    if (!doc) throw new NotFoundError(resourceName);
    return doc;
  }

  /**
   * Hard-delete a document by ID.
   * Use sparingly — prefer softDelete.
   */
  async hardDelete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }

  /**
   * Count documents matching a filter.
   */
  async count(filter: QueryFilter<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  /**
   * Check if a document exists matching the filter.
   */
  async exists(filter: QueryFilter<T>): Promise<boolean> {
    const result = await this.model.exists(filter).exec();
    return result !== null;
  }

  /**
   * Find with pagination, filtering, sorting, and optional population.
   */
  async findWithFilters(
    filter: QueryFilter<T>,
    options: FindWithFiltersOptions = {},
    projection?: ProjectionType<T>,
  ): Promise<RepositoryPaginatedResult<T>> {
    const { page, limit, skip, sortBy, sortOrder } = normalizeRepositoryPagination(options);
    const baseFilter = options.includeDeleted ? filter : combineWithActiveFilter(filter);
    const sort = buildSortObject(
      sortBy,
      sortOrder,
      options.allowedSortFields ?? ['createdAt', 'updatedAt'],
    );

    let query = this.model
      .find(baseFilter, projection)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    if (options.populate) {
      const paths = Array.isArray(options.populate)
        ? options.populate
        : [options.populate];
      query = query.populate(paths);
    }

    if (options.session) {
      query = query.session(options.session);
    }

    const [data, total] = await Promise.all([
      query.lean<T[]>().exec(),
      this.model.countDocuments(baseFilter).session(options.session ?? null).exec(),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  /**
   * Update with optional session and audit user tracking.
   */
  async updateWithAudit(
    id: string,
    update: UpdateQuery<T>,
    updatedBy?: string,
    resourceName = 'Resource',
    session?: ClientSession,
  ): Promise<T> {
    const updatePayload: UpdateQuery<T> = { ...update };
    if (updatedBy) {
      const existingSet = (updatePayload.$set ?? {}) as Record<string, unknown>;
      updatePayload.$set = { ...existingSet, updatedBy } as UpdateQuery<T>['$set'];
    }

    const doc = await this.model
      .findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true, session })
      .lean<T>()
      .exec();

    if (!doc) throw new NotFoundError(resourceName);
    return doc;
  }
}

function combineWithActiveFilter<T>(filter: QueryFilter<T>): QueryFilter<T> {
  return { ...activeOnlyFilter<T>(), ...filter } as QueryFilter<T>;
}
