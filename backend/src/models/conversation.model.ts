import mongoose, { Schema, type Document } from 'mongoose';
import { toJSONTransform } from '../shared/mongoose.js';

export interface IConversationDocument extends Document {
  participants: {
    userId: mongoose.Types.ObjectId;
    role: string;
    joinedAt: Date;
  }[];
  type: 'order' | 'support';
  orderId?: mongoose.Types.ObjectId;
  restaurantId?: mongoose.Types.ObjectId;
  lastMessage?: {
    content: string;
    senderId: mongoose.Types.ObjectId;
    senderRole: string;
    timestamp: Date;
  };
  status: 'active' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversationDocument>(
  {
    participants: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, required: true },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    type: {
      type: String,
      enum: ['order', 'support'],
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      index: true,
    },
    lastMessage: {
      content: { type: String },
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      senderRole: { type: String },
      timestamp: { type: Date },
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'closed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { transform: toJSONTransform },
  },
);

conversationSchema.index({ 'participants.userId': 1, type: 1 });
conversationSchema.index(
  { orderId: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: 'order' } },
);

export const Conversation = mongoose.model<IConversationDocument>(
  'Conversation',
  conversationSchema,
);
