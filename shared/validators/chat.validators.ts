import { z } from 'zod';

export const createConversationSchema = z.object({
  type: z.enum(['order', 'support']),
  orderId: z.string().optional(),
  restaurantId: z.string().optional(),
  participantId: z.string().min(1, 'Participant userId is required'),
  participantRole: z.string().min(1, 'Participant role is required'),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1).max(5000, 'Message too long'),
});

export const markReadSchema = z.object({
  conversationId: z.string().min(1),
});

export const chatTestSchema = z.object({
  type: z.enum(['order', 'support']).optional().default('order'),
  participantId: z.string().optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ChatTestInput = z.infer<typeof chatTestSchema>;
