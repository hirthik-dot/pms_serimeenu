import mongoose, { Schema, type Document, type Model } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import { FileCategory } from '@/types/enums';
import type { IFile } from '@/types/models';

export type FileDocument = IFile & Document;

const fileSchema = new Schema<IFile>(
  {
    ...baseSchemaDefinition,
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit' },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    url: { type: String, required: true },
    cloudinaryPublicId: { type: String },
    category: { type: String, enum: Object.values(FileCategory), default: FileCategory.Other },
  },
  baseSchemaOptions,
);

fileSchema.index({ patientId: 1, createdAt: -1 });
fileSchema.index({ visitId: 1 }, { sparse: true });
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ category: 1 });

applyBaseIndexes(fileSchema);
softDeletePlugin(fileSchema);
auditHooks(fileSchema, { resource: 'files' });

export const FileModel: Model<IFile> =
  (mongoose.models.File as Model<IFile> | undefined) ??
  mongoose.model<IFile>('File', fileSchema);

export const FILE_POPULATE = {
  list: [
    { path: 'patientId', select: 'patientId firstName lastName' },
    { path: 'uploadedBy', select: 'firstName lastName' },
  ],
} as const;
