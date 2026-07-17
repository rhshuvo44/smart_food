import type { Socket } from 'socket.io';
import type { Server as SocketServer } from 'socket.io';
import { sendMessage, markConversationRead } from './chat.service.js';
import { logger } from '../../config/logger.js';
import { ChatSocketEvents } from '@smartfood/shared';
import type {
  IChatJoinPayload,
  IChatLeavePayload,
  IChatSendMessagePayload,
  IChatTypingPayload,
  IChatMarkReadPayload,
} from '@smartfood/shared';

export function registerChatSocketHandlers(io: SocketServer, socket: Socket): void {
  const userId = (socket as any).userId as string;
  const userRole = (socket as any).userRole as string;

  socket.on(ChatSocketEvents.JOIN, (payload: IChatJoinPayload) => {
    const room = `conversation:${payload.conversationId}`;
    socket.join(room);
    logger.info('Joined conversation room', {
      socketId: socket.id,
      conversationId: payload.conversationId,
      userId,
    });
  });

  socket.on(ChatSocketEvents.LEAVE, (payload: IChatLeavePayload) => {
    const room = `conversation:${payload.conversationId}`;
    socket.leave(room);
    logger.info('Left conversation room', {
      socketId: socket.id,
      conversationId: payload.conversationId,
      userId,
    });
  });

  socket.on(
    ChatSocketEvents.SEND_MESSAGE,
    async (
      payload: IChatSendMessagePayload,
      ack?: (response: { success: boolean; error?: string; message?: unknown }) => void,
    ) => {
      try {
        const message = await sendMessage(
          payload.conversationId,
          userId,
          userRole,
          payload.content,
        );

        const room = `conversation:${payload.conversationId}`;
        io.to(room).emit(ChatSocketEvents.NEW_MESSAGE, {
          conversationId: payload.conversationId,
          message,
        });

        if (ack) ack({ success: true, message });
      } catch (error: unknown) {
        logger.error('Failed to send chat message', {
          error: String(error),
          userId,
          conversationId: payload.conversationId,
        });
        if (ack)
          ack({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    },
  );

  socket.on(ChatSocketEvents.TYPING, (payload: IChatTypingPayload) => {
    const room = `conversation:${payload.conversationId}`;
    socket.to(room).emit(ChatSocketEvents.USER_TYPING, {
      conversationId: payload.conversationId,
      userId,
      userRole,
      isTyping: payload.isTyping,
    });
  });

  socket.on(ChatSocketEvents.MARK_READ, async (payload: IChatMarkReadPayload) => {
    try {
      const result = await markConversationRead(payload.conversationId, userId);

      const room = `conversation:${payload.conversationId}`;
      socket.to(room).emit(ChatSocketEvents.READ_RECEIPT, {
        conversationId: payload.conversationId,
        userId,
        readAt: new Date().toISOString(),
      });

      logger.info('Chat read receipt sent', {
        conversationId: payload.conversationId,
        userId,
        ...result,
      });
    } catch (error: unknown) {
      logger.error('Failed to mark chat as read', {
        error: String(error),
        userId,
        conversationId: payload.conversationId,
      });
    }
  });
}
