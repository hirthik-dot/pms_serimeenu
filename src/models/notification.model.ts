import mongoose, { Schema, type Document, type Model } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import { NotificationPriority, NotificationStatus, NotificationType } from '@/types/enums';
import type { INotification } from '@/types/models';

export type NotificationDocument = INotification & Document;

const notificationSchema = new Schema<INotification>(
  {
    ...baseSchemaDefinition,
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    priority: { type: String, enum: Object.values(NotificationPriority), default: NotificationPriority.Medium },
    status: { type: String, enum: Object.values(NotificationStatus), default: NotificationStatus.Unread },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    resource: { type: String, trim: true },
    resourceId: { type: String, trim: true },
    readAt: { type: Date },
    expiresAt: { type: Date },
  },
  baseSchemaOptions,
);

notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

applyBaseIndexes(notificationSchema);
softDeletePlugin(notificationSchema);
auditHooks(notificationSchema, { resource: 'notifications' });

export const NotificationModel: Model<INotification> =
  (mongoose.models.Notification as Model<INotification> | undefined) ??
  mongoose.model<INotification>('Notification', notificationSchema);
