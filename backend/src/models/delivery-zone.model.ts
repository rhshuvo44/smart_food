import mongoose, { Schema, type Document } from 'mongoose';
import { toJSONTransform } from '../shared/mongoose.js';

export interface IDeliveryZoneDocument extends Document {
  name: string;
  /**
   * GeoJSON Polygon boundary.
   * coordinates[0] is the outer ring (linear ring of [lng, lat] positions).
   * The ring must be closed (first and last position equal).
   */
  boundary: {
    type: 'Polygon';
    coordinates: Array<Array<[number, number]>>;
  };
  baseFee: number;
  feePerKm: number;
  estimatedMinutes: number;
  isActive: boolean;
}

const deliveryZoneSchema = new Schema<IDeliveryZoneDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    boundary: {
      type: {
        type: String,
        enum: ['Polygon'],
        default: 'Polygon',
        required: true,
      },
      coordinates: {
        type: [[[Number]]], // Array of rings, each ring is array of [lng, lat] pairs
        required: true,
      },
    },
    baseFee: { type: Number, required: true, min: 0 },
    feePerKm: { type: Number, required: true, min: 0 },
    estimatedMinutes: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { transform: toJSONTransform },
  },
);

// 2dsphere index for geospatial queries ($geoIntersects, $geoWithin)
deliveryZoneSchema.index({ boundary: '2dsphere' });
deliveryZoneSchema.index({ isActive: 1 });

export const DeliveryZone = mongoose.model<IDeliveryZoneDocument>(
  'DeliveryZone',
  deliveryZoneSchema,
);
