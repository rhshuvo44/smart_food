import mongoose, { Schema, type Document } from 'mongoose';

export type NotificationType =
  | 'order_confirmation'
  | 'order_status'
  | 'order_cancelled'
  | 'order_completed'
  | 'payment_received'
  | 'delivery_update';

export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app';

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'opened';

export interface INotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  status: NotificationStatus;
  readAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'order_confirmation',
        'order_status',
        'order_cancelled',
        'order_completed',
        'payment_received',
        'delivery_update',
      ],
      required: true,
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
      maxlength: 2000,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed', 'opened'],
      default: 'pending',
    },
    readAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
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

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ userId: 1, readAt: 1 });

export const Notification = mongoose.model<INotificationDocument>(
  'Notification',
  notificationSchema,
);
