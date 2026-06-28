import mongoose, { Schema, type Document, type Model } from 'mongoose';

import { SequenceKey } from '@/types/enums';
import type { ISequence } from '@/types/models';

export type SequenceDocument = ISequence & Document;

const sequenceSchema = new Schema<ISequence>(
  {
    key: { type: String, required: true },
    prefix: { type: String, trim: true, uppercase: true },
    year: { type: Number },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: String },
    value: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

sequenceSchema.index(
  { key: 1, prefix: 1 },
  { unique: true, partialFilterExpression: { doctorId: { $exists: false }, date: { $exists: false }, year: { $exists: false } } },
);
sequenceSchema.index(
  { key: 1, year: 1 },
  { unique: true, partialFilterExpression: { year: { $exists: true }, doctorId: { $exists: false }, date: { $exists: false } } },
);
sequenceSchema.index(
  { key: 1, doctorId: 1, date: 1 },
  { unique: true, partialFilterExpression: { doctorId: { $exists: true }, date: { $exists: true } } },
);

export const SequenceModel: Model<ISequence> =
  (mongoose.models.Sequence as Model<ISequence> | undefined) ??
  mongoose.model<ISequence>('Sequence', sequenceSchema);

export { SequenceKey };
