import type { Request, Response } from 'express';
import {
  getConversations,
  getMessages,
  createConversation,
  sendMessage,
  markConversationRead,
  createTestData,
  clearTestData,
} from './chat.service.js';
import { createConversationSchema, sendMessageSchema } from '@smartfood/shared';
import { ValidationError } from '../../shared/errors.js';
import { logger } from '../../config/logger.js';

export async function handleGetConversations(req: Request, res: Response): Promise<void> {
  const { page = '1', limit = '20' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));

  const result = await getConversations(req.userId as string, req.userRole as string, {
    page: pageNum,
    limit: limitNum,
  });

  res.status(200).json({
    success: true,
    data: result,
    correlationId: req.correlationId,
  });
}

export async function handleGetMessages(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { page = '1', limit = '50' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));

  const result = await getMessages(id, req.userId as string, { page: pageNum, limit: limitNum });

  res.status(200).json({
    success: true,
    data: result,
    correlationId: req.correlationId,
  });
}

export async function handleCreateConversation(req: Request, res: Response): Promise<void> {
  const parsed = createConversationSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError('Invalid input', { errors: parsed.error.flatten().fieldErrors });
  }

  const conversation = await createConversation(
    req.userId as string,
    req.userRole as string,
    parsed.data,
  );

  res.status(201).json({
    success: true,
    data: { conversation },
    correlationId: req.correlationId,
  });
}

export async function handleSendMessage(req: Request, res: Response): Promise<void> {
  const parsed = sendMessageSchema.safeParse({ ...req.body, conversationId: req.params.id });
  if (!parsed.success) {
    throw new ValidationError('Invalid input', { errors: parsed.error.flatten().fieldErrors });
  }

  const message = await sendMessage(
    parsed.data.conversationId,
    req.userId as string,
    req.userRole as string,
    parsed.data.content,
  );

  res.status(201).json({
    success: true,
    data: { message },
    correlationId: req.correlationId,
  });
}

export async function handleMarkRead(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const result = await markConversationRead(id, req.userId as string);

  res.status(200).json({
    success: true,
    data: result,
    correlationId: req.correlationId,
  });
}

export async function handleSendTestMessage(req: Request, res: Response): Promise<void> {
  const { type = 'order' } = req.body;

  const result = await createTestData(req.userId as string, type);

  logger.info('Test chat data created', { userId: req.userId, type });

  res.status(201).json({
    success: true,
    data: result,
    correlationId: req.correlationId,
  });
}

export async function handleStopChat(req: Request, res: Response): Promise<void> {
  const result = await clearTestData(req.userId as string);

  logger.info('Chat test data cleared', { userId: req.userId });

  res.status(200).json({
    success: true,
    data: result,
    correlationId: req.correlationId,
  });
}
