import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface IRefreshToken {
  userId: Types.ObjectId;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  revokedAt?: Date;
  replacedByTokenHash?: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RefreshTokenDocument = IRefreshToken & Document;

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    familyId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    replacedByTokenHash: { type: String },
    userAgent: { type: String },
    ipAddress: { type: String },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel: Model<IRefreshToken> =
  (mongoose.models.RefreshToken as Model<IRefreshToken> | undefined) ??
  mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
