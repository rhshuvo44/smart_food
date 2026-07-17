import mongoose, { Schema, type Document } from 'mongoose';
import { toJSONTransform } from '../shared/mongoose.js';
import type { DeliveryStatus } from '@smartfood/shared';

interface ITrackingEventDocument {
  status: DeliveryStatus;
  location?: { type: 'Point'; coordinates: [number, number]; address?: Record<string, unknown> };
  timestamp: Date;
  note?: string;
}

export interface IDeliveryDocument extends Document {
  orderId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  driverName?: string;
  driverPhone?: string;
  driverLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  status: DeliveryStatus;
  estimatedArrival?: Date;
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  lastUpdated: Date;
  trackingHistory: ITrackingEventDocument[];
}

const trackingEventSchema = new Schema<ITrackingEventDocument>(
  {
    status: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
    timestamp: { type: Date, required: true, default: Date.now },
    note: { type: String },
  },
  { _id: false },
);

const deliverySchema = new Schema<IDeliveryDocument>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    driverName: { type: String, trim: true },
    driverPhone: { type: String, trim: true },
    driverLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] },
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed'],
      default: 'pending',
    },
    estimatedArrival: { type: Date },
    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] },
    },
    lastUpdated: { type: Date, default: Date.now },
    trackingHistory: { type: [trackingEventSchema], default: [] },
  },
  {
    timestamps: false,
    toJSON: { transform: toJSONTransform },
  },
);

deliverySchema.index({ driverId: 1, status: 1 });
deliverySchema.index({ status: 1 });
deliverySchema.index({ 'driverLocation.coordinates': '2dsphere' });

export const Delivery = mongoose.model<IDeliveryDocument>('Delivery', deliverySchema);
