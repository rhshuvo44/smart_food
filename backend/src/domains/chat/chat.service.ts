import mongoose from 'mongoose';
import { Conversation } from '../../models/conversation.model.js';
import { Message } from '../../models/message.model.js';
import { User } from '../../models/user.model.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';
import { logger } from '../../config/logger.js';

interface GetConversationsOptions {
  page: number;
  limit: number;
}

export async function getConversations(
  userId: string,
  _role: string,
  options: GetConversationsOptions,
) {
  const { page, limit } = options;
  const skip = (page - 1) * limit;

  const filter = { 'participants.userId': new mongoose.Types.ObjectId(userId) };

  const [conversations, total] = await Promise.all([
    Conversation.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    Conversation.countDocuments(filter),
  ]);

  const conversationIds = conversations.map((c) => c._id);

  const unreadCounts =
    conversationIds.length > 0
      ? await Message.aggregate([
          { $match: { conversationId: { $in: conversationIds } } },
          {
            $group: {
              _id: '$conversationId',
              unreadCount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $ne: ['$senderId', new mongoose.Types.ObjectId(userId)] },
                        {
                          $not: {
                            $in: [
                              new mongoose.Types.ObjectId(userId),
                              { $ifNull: ['$readBy.userId', []] },
                            ],
                          },
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ])
      : [];

  const unreadMap = new Map(unreadCounts.map((u) => [String(u._id), u.unreadCount]));

  return {
    conversations: conversations.map((c) => {
      const obj: Record<string, unknown> = {
        ...c,
        id: String(c._id),
        unreadCount: unreadMap.get(String(c._id)) || 0,
      };
      delete obj._id;
      delete obj.__v;
      return obj as ReturnType<typeof enrichConversation>;
    }),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

function enrichConversation(conv: Record<string, unknown>) {
  return conv;
}

export async function getMessages(
  conversationId: string,
  userId: string,
  options: GetConversationsOptions,
) {
  const { page, limit } = options;
  const skip = (page - 1) * limit;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new NotFoundError('Conversation not found');

  const isParticipant = conversation.participants.some((p) => String(p.userId) === userId);
  if (!isParticipant) throw new ForbiddenError('Not a participant in this conversation');

  const [messages, total] = await Promise.all([
    Message.find({ conversationId: new mongoose.Types.ObjectId(conversationId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Message.countDocuments({ conversationId: new mongoose.Types.ObjectId(conversationId) }),
  ]);

  return {
    messages: messages.map((m) => {
      const obj: Record<string, unknown> = { ...m, id: String(m._id) };
      delete obj._id;
      delete obj.__v;
      return obj;
    }),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function createConversation(
  creatorId: string,
  creatorRole: string,
  input: {
    type: 'order' | 'support';
    orderId?: string;
    restaurantId?: string;
    participantId: string;
    participantRole: string;
  },
) {
  if (input.type === 'order' && input.orderId) {
    const existing = await Conversation.findOne({
      type: 'order',
      orderId: new mongoose.Types.ObjectId(input.orderId),
    });
    if (existing) {
      return existing.toJSON();
    }
  }

  const conversation = await Conversation.create({
    participants: [
      { userId: new mongoose.Types.ObjectId(creatorId), role: creatorRole, joinedAt: new Date() },
      {
        userId: new mongoose.Types.ObjectId(input.participantId),
        role: input.participantRole,
        joinedAt: new Date(),
      },
    ],
    type: input.type,
    orderId: input.orderId ? new mongoose.Types.ObjectId(input.orderId) : undefined,
    restaurantId: input.restaurantId ? new mongoose.Types.ObjectId(input.restaurantId) : undefined,
    status: 'active',
  });

  logger.info('Conversation created', { conversationId: conversation._id, type: input.type });
  return conversation.toJSON();
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderRole: string,
  content: string,
  messageType: 'text' | 'system' = 'text',
) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new NotFoundError('Conversation not found');

  const isParticipant = conversation.participants.some((p) => String(p.userId) === senderId);
  if (!isParticipant) throw new ForbiddenError('Not a participant in this conversation');

  if (conversation.status === 'closed') {
    throw new ForbiddenError('Conversation is closed');
  }

  const message = await Message.create({
    conversationId: new mongoose.Types.ObjectId(conversationId),
    senderId: new mongoose.Types.ObjectId(senderId),
    senderRole,
    content,
    messageType,
    readBy: [{ userId: new mongoose.Types.ObjectId(senderId), readAt: new Date() }],
  });

  conversation.lastMessage = {
    content,
    senderId: new mongoose.Types.ObjectId(senderId),
    senderRole,
    timestamp: new Date(),
  };
  conversation.status = 'active';
  await conversation.save();

  return message.toJSON();
}

export async function markConversationRead(conversationId: string, userId: string) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new NotFoundError('Conversation not found');

  const isParticipant = conversation.participants.some((p) => String(p.userId) === userId);
  if (!isParticipant) throw new ForbiddenError('Not a participant in this conversation');

  const result = await Message.updateMany(
    {
      conversationId: new mongoose.Types.ObjectId(conversationId),
      'readBy.userId': { $ne: new mongoose.Types.ObjectId(userId) },
      senderId: { $ne: new mongoose.Types.ObjectId(userId) },
    },
    {
      $push: { readBy: { userId: new mongoose.Types.ObjectId(userId), readAt: new Date() } },
    },
  );

  logger.info('Messages marked as read', {
    conversationId,
    userId,
    modifiedCount: result.modifiedCount,
  });
  return { modifiedCount: result.modifiedCount };
}

export async function createTestData(userId: string, type: 'order' | 'support' = 'order') {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  const otherUser = await User.findOne({ role: type === 'order' ? 'restaurant_owner' : 'admin' });
  if (!otherUser) {
    const admin = await User.create({
      email: 'test-admin@smartfood.app',
      passwordHash: 'TestPass123!',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'admin',
    });
    const conversation = await Conversation.create({
      participants: [
        { userId: user._id, role: user.role, joinedAt: new Date() },
        { userId: admin._id, role: 'admin', joinedAt: new Date() },
      ],
      type: 'support',
      status: 'active',
    });
    await Message.create({
      conversationId: conversation._id,
      senderId: admin._id,
      senderRole: 'admin',
      content: 'Hello! This is a test message from the admin team. How can we help you?',
      messageType: 'text',
      readBy: [{ userId: admin._id, readAt: new Date() }],
    });
    conversation.lastMessage = {
      content: 'Hello! This is a test message from the admin team. How can we help you?',
      senderId: admin._id,
      senderRole: 'admin',
      timestamp: new Date(),
    };
    await conversation.save();
    return { conversation: conversation.toJSON(), message: 'Test chat data created' };
  }

  const conversation = await Conversation.create({
    participants: [
      { userId: user._id, role: user.role, joinedAt: new Date() },
      { userId: otherUser._id, role: otherUser.role, joinedAt: new Date() },
    ],
    type,
    status: 'active',
  });

  await Message.create({
    conversationId: conversation._id,
    senderId: otherUser._id,
    senderRole: otherUser.role,
    content: `Hello! This is a test message for ${type} chat.`,
    messageType: 'text',
    readBy: [{ userId: otherUser._id, readAt: new Date() }],
  });

  conversation.lastMessage = {
    content: `Hello! This is a test message for ${type} chat.`,
    senderId: otherUser._id,
    senderRole: otherUser.role,
    timestamp: new Date(),
  };
  await conversation.save();

  logger.info('Test chat data created', { userId, conversationId: conversation._id });
  return { conversation: conversation.toJSON(), message: 'Test chat data created' };
}

export async function clearTestData(userId: string) {
  const conversations = await Conversation.find({
    'participants.userId': new mongoose.Types.ObjectId(userId),
  });

  const conversationIds = conversations.map((c) => c._id);
  await Message.deleteMany({ conversationId: { $in: conversationIds } });
  await Conversation.deleteMany({ _id: { $in: conversationIds } });

  logger.info('Test chat data cleared', { userId, removedCount: conversationIds.length });
  return { removedCount: conversationIds.length };
}
