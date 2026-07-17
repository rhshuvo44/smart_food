import mongoose, { Schema, type Document } from 'mongoose';
import { toJSONTransform } from '../shared/mongoose.js';
import type { IBusinessHours } from '@smartfood/shared';

export interface IBusinessHoursDocument extends IBusinessHours {}

export interface IRestaurantDocument extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  cuisine: string[];
  address: {
    type: 'Point';
    coordinates: [number, number];
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      formatted: string;
    };
  };
  phone: string;
  email: string;
  imageUrl?: string;
  coverImageUrl?: string;
  businessHours: IBusinessHoursDocument[];
  deliveryRadius: number;
  deliveryFee: number;
  minimumOrder: number;
  rating: number;
  isActive: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const businessHoursSchema = new Schema<IBusinessHoursDocument>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    openTime: { type: String, required: true },
    closeTime: { type: String, required: true },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false },
);

const restaurantSchema = new Schema<IRestaurantDocument>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    cuisine: [{ type: String, trim: true }],
    address: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
      address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
        formatted: { type: String, required: true },
      },
    },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    imageUrl: { type: String },
    coverImageUrl: { type: String },
    businessHours: { type: [businessHoursSchema], default: [] },
    deliveryRadius: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    minimumOrder: { type: Number, required: true, min: 0, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    isActive: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { transform: toJSONTransform },
  },
);

restaurantSchema.index({ 'address.coordinates': '2dsphere' });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ name: 'text', 'address.address.formatted': 'text' });
restaurantSchema.index({ isActive: 1, isApproved: 1 });

export const Restaurant = mongoose.model<IRestaurantDocument>('Restaurant', restaurantSchema);
