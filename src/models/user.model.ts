import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

import { UserRole, UserStatus } from '@/types/enums';

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  roleId?: Types.ObjectId;
  status: UserStatus;
  permissions: string[];
  tokenVersion: number;
  avatar?: string;
  lastLoginAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = IUser & Document;

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 100 },
    lastName: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role' },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.Active,
    },
    permissions: { type: [String], default: [] },
    tokenVersion: { type: Number, default: 0 },
    avatar: { type: String },
    lastLoginAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, status: 1 });
userSchema.index({ isDeleted: 1 });

export const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser> | undefined) ??
  mongoose.model<IUser>('User', userSchema);
