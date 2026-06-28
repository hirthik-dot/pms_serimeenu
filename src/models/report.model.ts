import mongoose, { Schema, type Document, type Model } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import { ReportStatus, ReportType } from '@/types/enums';
import type { IReport } from '@/types/models';

export type ReportDocument = IReport & Document;

const reportSchema = new Schema<IReport>(
  {
    ...baseSchemaDefinition,
    type: { type: String, enum: Object.values(ReportType), required: true },
    status: { type: String, enum: Object.values(ReportStatus), default: ReportStatus.Pending },
    parameters: { type: Schema.Types.Mixed, default: {} },
    result: { type: Schema.Types.Mixed },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date },
    errorMessage: { type: String, trim: true },
    expiresAt: { type: Date },
    fileUrl: { type: String },
  },
  baseSchemaOptions,
);

reportSchema.index({ type: 1, status: 1, createdAt: -1 });
reportSchema.index({ generatedBy: 1, createdAt: -1 });
reportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

applyBaseIndexes(reportSchema);
softDeletePlugin(reportSchema);
auditHooks(reportSchema, { resource: 'reports' });

export const ReportModel: Model<IReport> =
  (mongoose.models.Report as Model<IReport> | undefined) ??
  mongoose.model<IReport>('Report', reportSchema);
