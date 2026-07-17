import mongoose, { Schema, type Document } from 'mongoose';
import type { NotificationChannel } from './notification.model.js';

export interface INotificationTemplateDocument extends Document {
  key: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  locale: string;
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationTemplateSchema = new Schema<INotificationTemplateDocument>(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['push', 'email', 'sms', 'in_app'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    body: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    locale: {
      type: String,
      default: 'en',
      trim: true,
      maxlength: 5,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Compound unique index on key + channel + locale
notificationTemplateSchema.index({ key: 1, channel: 1, locale: 1 }, { unique: true });
notificationTemplateSchema.index({ isActive: 1 });

export const NotificationTemplate = mongoose.model<INotificationTemplateDocument>(
  'NotificationTemplate',
  notificationTemplateSchema,
);
