export interface IChatParticipant {
  userId: string;
  role: string;
  joinedAt: string;
}

export interface ILastMessage {
  content: string;
  senderId: string;
  senderRole: string;
  timestamp: string;
}

export type ConversationType = 'order' | 'support';
export type ConversationStatus = 'active' | 'resolved' | 'closed';
export type MessageType = 'text' | 'system';

export interface IConversation {
  id: string;
  participants: IChatParticipant[];
  type: ConversationType;
  orderId?: string;
  restaurantId?: string;
  lastMessage?: ILastMessage;
  status: ConversationStatus;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  content: string;
  messageType: MessageType;
  readBy: { userId: string; readAt: string }[];
  createdAt: string;
}
