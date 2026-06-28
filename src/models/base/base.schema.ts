// =============================================================================
// Base Schema — Reusable audit, soft-delete, and versioning fields
// =============================================================================

import { Schema, type SchemaDefinition } from 'mongoose';

import type { IBaseFields } from '@/types/models';

export const baseSchemaDefinition: SchemaDefinition<IBaseFields> = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  version: { type: Number, default: 1 },
};

export const baseSchemaOptions = {
  timestamps: true,
} as const;

export const appendOnlySchemaOptions = {
  timestamps: { createdAt: true, updatedAt: false },
} as const;

export function applyBaseIndexes(schema: Schema): void {
  schema.index({ createdAt: -1 });
}
