import mongoose, { Schema, type Document, type Model } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import type { IPermission } from '@/types/models';

export type PermissionDocument = IPermission & Document;

const permissionSchema = new Schema<IPermission>(
  {
    ...baseSchemaDefinition,
    code: { type: String, required: true, unique: true, trim: true, lowercase: true },
    resource: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    module: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  baseSchemaOptions,
);

permissionSchema.index({ code: 1 }, { unique: true });
permissionSchema.index({ resource: 1, action: 1 });
permissionSchema.index({ module: 1, isActive: 1 });
applyBaseIndexes(permissionSchema);
softDeletePlugin(permissionSchema);
auditHooks(permissionSchema, { resource: 'permissions' });

export const PermissionModel: Model<IPermission> =
  (mongoose.models.Permission as Model<IPermission> | undefined) ??
  mongoose.model<IPermission>('Permission', permissionSchema);
