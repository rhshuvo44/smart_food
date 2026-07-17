import mongoose, { Schema, type Document } from 'mongoose';
import { toJSONTransform } from '../shared/mongoose.js';
import { OrderStatus } from '@smartfood/shared';

export interface IOrderItemDocument {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
}

export interface IOrderDocument extends Document {
  customerId: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  items: IOrderItemDocument[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  tip?: number;
  total: number;
  status: (typeof OrderStatus)[keyof typeof OrderStatus];
  deliveryAddress: {
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
  paymentId?: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItemDocument>(
  {
    menuItemId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    specialInstructions: { type: String, maxlength: 500 },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrderDocument>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [itemsMinLength, 'At least one item required'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    tip: { type: Number, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    deliveryAddress: {
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
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    driverId: { type: Schema.Types.ObjectId, ref: 'User' },
    estimatedDeliveryTime: { type: Date },
    actualDeliveryTime: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { transform: toJSONTransform },
  },
);

function itemsMinLength(val: unknown[]): boolean {
  return val.length > 0;
}

orderSchema.index({ customerId: 1, status: 1 });
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ driverId: 1, status: 1 });
orderSchema.index({ 'deliveryAddress.coordinates': '2dsphere' });

export const Order = mongoose.model<IOrderDocument>('Order', orderSchema);
