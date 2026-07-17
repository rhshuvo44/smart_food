import mongoose, { Schema, type Document } from 'mongoose';

export interface IChannelPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
  in_app: boolean;
}

export interface ITypePreferences {
  order_confirmation: boolean;
  order_status: boolean;
  order_cancelled: boolean;
  order_completed: boolean;
  payment_received: boolean;
  delivery_update: boolean;
}

export interface INotificationPreferenceDocument extends Document {
  userId: mongoose.Types.ObjectId;
  channels: IChannelPreferences;
  types: ITypePreferences;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const channelDefaults: IChannelPreferences = {
  push: true,
  email: true,
  sms: true,
  in_app: true,
};

const typeDefaults: ITypePreferences = {
  order_confirmation: true,
  order_status: true,
  order_cancelled: true,
  order_completed: true,
  payment_received: true,
  delivery_update: true,
};

const notificationPreferenceSchema = new Schema<INotificationPreferenceDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    channels: {
      type: Schema.Types.Mixed,
      default: { ...channelDefaults },
      validate: {
        validator(value: unknown) {
          if (typeof value !== 'object' || value === null) return false;
          const obj = value as Record<string, unknown>;
          return (
            typeof obj.push === 'boolean' &&
            typeof obj.email === 'boolean' &&
            typeof obj.sms === 'boolean' &&
            typeof obj.in_app === 'boolean'
          );
        },
        message: 'Channels must be an object with boolean values for push, email, sms, in_app',
      },
    },
    types: {
      type: Schema.Types.Mixed,
      default: { ...typeDefaults },
      validate: {
        validator(value: unknown) {
          if (typeof value !== 'object' || value === null) return false;
          const obj = value as Record<string, unknown>;
          return (
            typeof obj.order_confirmation === 'boolean' &&
            typeof obj.order_status === 'boolean' &&
            typeof obj.order_cancelled === 'boolean' &&
            typeof obj.order_completed === 'boolean' &&
            typeof obj.payment_received === 'boolean' &&
            typeof obj.delivery_update === 'boolean'
          );
        },
        message: 'Types must be an object with boolean values for all notification types',
      },
    },
    quietHoursStart: {
      type: String,
      default: null,
      validate: {
        validator(value: string) {
          if (!value) return true;
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
        },
        message: 'quietHoursStart must be in HH:mm format',
      },
    },
    quietHoursEnd: {
      type: String,
      default: null,
      validate: {
        validator(value: string) {
          if (!value) return true;
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
        },
        message: 'quietHoursEnd must be in HH:mm format',
      },
    },
    timezone: {
      type: String,
      default: 'UTC',
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

export const NotificationPreference = mongoose.model<INotificationPreferenceDocument>(
  'NotificationPreference',
  notificationPreferenceSchema,
);
