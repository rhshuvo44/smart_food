export const ChatSocketEvents = {
  JOIN: 'chat:join',
  LEAVE: 'chat:leave',
  SEND_MESSAGE: 'chat:send-message',
  NEW_MESSAGE: 'chat:new-message',
  TYPING: 'chat:typing',
  USER_TYPING: 'chat:user-typing',
  MARK_READ: 'chat:mark-read',
  READ_RECEIPT: 'chat:read-receipt',
} as const;

export interface IChatJoinPayload {
  conversationId: string;
}

export interface IChatLeavePayload {
  conversationId: string;
}

export interface IChatSendMessagePayload {
  conversationId: string;
  content: string;
}

export interface IChatNewMessagePayload {
  conversationId: string;
  message: {
    id: string;
    senderId: string;
    senderRole: string;
    content: string;
    messageType: string;
    createdAt: string;
  };
}

export interface IChatTypingPayload {
  conversationId: string;
  isTyping: boolean;
}

export interface IChatUserTypingPayload {
  conversationId: string;
  userId: string;
  userRole: string;
  isTyping: boolean;
}

export interface IChatMarkReadPayload {
  conversationId: string;
}

export interface IChatReadReceiptPayload {
  conversationId: string;
  userId: string;
  readAt: string;
}
