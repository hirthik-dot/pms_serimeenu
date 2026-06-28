import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ILoginAttempt {
  ipAddress: string;
  email?: string;
  success: boolean;
  createdAt: Date;
}

export type LoginAttemptDocument = ILoginAttempt & Document;

const loginAttemptSchema = new Schema<ILoginAttempt>(
  {
    ipAddress: { type: String, required: true, index: true },
    email: { type: String, lowercase: true, trim: true },
    success: { type: Boolean, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

loginAttemptSchema.index({ ipAddress: 1, createdAt: -1 });
loginAttemptSchema.index({ email: 1, createdAt: -1 });

export const LoginAttemptModel: Model<ILoginAttempt> =
  (mongoose.models.LoginAttempt as Model<ILoginAttempt> | undefined) ??
  mongoose.model<ILoginAttempt>('LoginAttempt', loginAttemptSchema);
