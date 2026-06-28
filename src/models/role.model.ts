import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IRole {
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type RoleDocument = IRole & Document;

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    displayName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);



export const RoleModel: Model<IRole> =
  (mongoose.models.Role as Model<IRole> | undefined) ??
  mongoose.model<IRole>('Role', roleSchema);
