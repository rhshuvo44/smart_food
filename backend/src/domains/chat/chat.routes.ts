import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import {
  handleGetConversations,
  handleGetMessages,
  handleCreateConversation,
  handleSendMessage,
  handleMarkRead,
  handleSendTestMessage,
  handleStopChat,
} from './chat.controller.js';

const router = Router();

router.get('/conversations', authMiddleware, asyncHandler(handleGetConversations));

router.get('/conversations/:id/messages', authMiddleware, asyncHandler(handleGetMessages));

router.post('/conversations', authMiddleware, asyncHandler(handleCreateConversation));

router.post('/conversations/:id/messages', authMiddleware, asyncHandler(handleSendMessage));

router.patch('/conversations/:id/read', authMiddleware, asyncHandler(handleMarkRead));

router.post('/chat/test', authMiddleware, asyncHandler(handleSendTestMessage));
router.post('/chat/stop', authMiddleware, asyncHandler(handleStopChat));

export { router as chatRoutes };
