import mongoose, { Schema, type Document } from 'mongoose';
import { toJSONTransform } from '../shared/mongoose.js';

export interface IUserAddressDocument extends Document {
  userId: mongoose.Types.ObjectId;
  label: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    formatted: string;
  };
  isDefault: boolean;
  geoPoint: {
    type: 'Point';
    coordinates: [number, number];
  };
}

const userAddressSchema = new Schema<IUserAddressDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
      formatted: { type: String, required: true },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    geoPoint: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
  },
  {
    timestamps: true,
    toJSON: { transform: toJSONTransform },
  },
);

userAddressSchema.index({ userId: 1 });
userAddressSchema.index({ userId: 1, isDefault: 1 });
userAddressSchema.index({ 'geoPoint.coordinates': '2dsphere' });

export const UserAddress = mongoose.model<IUserAddressDocument>('UserAddress', userAddressSchema);
