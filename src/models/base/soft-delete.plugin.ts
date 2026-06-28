// =============================================================================
// Soft Delete Plugin — Reusable soft delete / restore for Mongoose schemas
// =============================================================================

import type { ClientSession, Document, Model, Schema, Types } from 'mongoose';

export interface SoftDeleteDocument extends Document {
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

export interface SoftDeleteModel<T extends SoftDeleteDocument> extends Model<T> {
  softDeleteById(
    id: string,
    deletedBy?: string,
    session?: ClientSession,
  ): Promise<T | null>;
  restoreById(
    id: string,
    restoredBy?: string,
    session?: ClientSession,
  ): Promise<T | null>;
}

export interface SoftDeleteOptions {
  /** When true, hardDelete is blocked at the model level */
  preventHardDelete?: boolean;
}

export function softDeletePlugin(
  schema: Schema,
  options: SoftDeleteOptions = { preventHardDelete: false },
): void {
  schema.methods.softDelete = async function softDelete(
    this: SoftDeleteDocument,
    deletedBy?: string,
    session?: ClientSession,
  ): Promise<SoftDeleteDocument> {
    this.isDeleted = true;
    this.deletedAt = new Date();
    if (deletedBy) {
      this.deletedBy = deletedBy as unknown as Types.ObjectId;
    }
    return this.save({ session });
  };

  schema.methods.restore = async function restore(
    this: SoftDeleteDocument,
    restoredBy?: string,
    session?: ClientSession,
  ): Promise<SoftDeleteDocument> {
    this.isDeleted = false;
    this.deletedAt = undefined;
    this.deletedBy = undefined;
    if (restoredBy) {
      this.updatedBy = restoredBy as unknown as Types.ObjectId;
    }
    return this.save({ session });
  };

  schema.statics.softDeleteById = async function softDeleteById(
    id: string,
    deletedBy?: string,
    session?: ClientSession,
  ) {
    const update: Record<string, unknown> = {
      isDeleted: true,
      deletedAt: new Date(),
    };
    if (deletedBy) {
      update.deletedBy = deletedBy;
    }
    return this.findByIdAndUpdate(id, { $set: update }, { new: true, session }).exec();
  };

  schema.statics.restoreById = async function restoreById(
    id: string,
    restoredBy?: string,
    session?: ClientSession,
  ) {
    const update: Record<string, unknown> = {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    };
    if (restoredBy) {
      update.updatedBy = restoredBy;
    }
    return this.findByIdAndUpdate(id, { $set: update }, { new: true, session }).exec();
  };

  if (options.preventHardDelete) {
    schema.pre('deleteOne', { document: true, query: false }, function blockHardDelete() {
      throw new Error('Hard delete is not permitted for this collection. Use soft delete.');
    });

    schema.pre('deleteMany', { document: false, query: true }, function blockHardDeleteMany() {
      throw new Error('Hard delete is not permitted for this collection. Use soft delete.');
    });
  }
}
