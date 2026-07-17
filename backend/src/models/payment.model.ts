import mongoose, { Schema, type Document } from 'mongoose';
import { toJSONTransform } from '../shared/mongoose.js';
import { PaymentStatus } from '@smartfood/shared';

export interface IPaymentDocument extends Document {
  orderId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: (typeof PaymentStatus)[keyof typeof PaymentStatus];
  stripePaymentIntentId?: string;
  stripeClientSecret?: string;
  sslcommerzSessionKey?: string;
  sslcommerzTranId?: string;
  paymentMethod?: string;
  refundAmount?: number;
  refundReason?: string;
  failureReason?: string;
  gateway?: 'stripe' | 'sslcommerz';
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPaymentDocument>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    stripePaymentIntentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    stripeClientSecret: { type: String },
    sslcommerzSessionKey: { type: String },
    sslcommerzTranId: { type: String },
    paymentMethod: { type: String },
    refundAmount: { type: Number, min: 0 },
    refundReason: { type: String },
    failureReason: { type: String },
    gateway: { type: String, enum: ['stripe', 'sslcommerz'] },
  },
  {
    timestamps: true,
    toJSON: { transform: toJSONTransform },
  },
);

paymentSchema.index({ customerId: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });

export const Payment = mongoose.model<IPaymentDocument>('Payment', paymentSchema);
