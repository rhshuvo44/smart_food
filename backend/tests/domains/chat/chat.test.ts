import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../../../src/models/user.model.js';
import { Conversation } from '../../../src/models/conversation.model.js';
import { Message } from '../../../src/models/message.model.js';
import { UserRole } from '@smartfood/shared';
import {
  getConversations,
  getMessages,
  createConversation,
  sendMessage,
  markConversationRead,
  createTestData,
  clearTestData,
} from '../../../src/domains/chat/chat.service.js';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: { dbName: 'smartfood_test_chat' },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

async function createCustomer() {
  return User.create({
    email: 'customer@test.com',
    passwordHash: 'Password123',
    firstName: 'Test',
    lastName: 'Customer',
    role: UserRole.CUSTOMER,
  });
}

async function createRestaurantOwner() {
  return User.create({
    email: 'restaurant@test.com',
    passwordHash: 'Password123',
    firstName: 'Test',
    lastName: 'Restaurant',
    role: UserRole.RESTAURANT_OWNER,
  });
}

async function createAdmin() {
  return User.create({
    email: 'admin@test.com',
    passwordHash: 'Password123',
    firstName: 'Test',
    lastName: 'Admin',
    role: UserRole.ADMIN,
  });
}

describe('Chat Domain', () => {
  describe('Conversation Model', () => {
    it('should create an order conversation', async () => {
      const customer = await createCustomer();
      const owner = await createRestaurantOwner();

      const conversation = await Conversation.create({
        participants: [
          { userId: customer._id, role: UserRole.CUSTOMER, joinedAt: new Date() },
          { userId: owner._id, role: UserRole.RESTAURANT_OWNER, joinedAt: new Date() },
        ],
        type: 'order',
        orderId: new mongoose.Types.ObjectId(),
        status: 'active',
      });

      expect(conversation).toBeDefined();
      expect(conversation.participants).toHaveLength(2);
      expect(conversation.type).toBe('order');
      expect(conversation.status).toBe('active');
    });

    it('should create a support conversation', async () => {
      const owner = await createRestaurantOwner();
      const admin = await createAdmin();

      const conversation = await Conversation.create({
        participants: [
          { userId: owner._id, role: UserRole.RESTAURANT_OWNER, joinedAt: new Date() },
          { userId: admin._id, role: UserRole.ADMIN, joinedAt: new Date() },
        ],
        type: 'support',
        restaurantId: new mongoose.Types.ObjectId(),
        status: 'active',
      });

      expect(conversation).toBeDefined();
      expect(conversation.type).toBe('support');
    });

    it('should enforce unique order conversations', async () => {
      const customer = await createCustomer();
      const owner = await createRestaurantOwner();
      const orderId = new mongoose.Types.ObjectId();

      await Conversation.create({
        participants: [
          { userId: customer._id, role: UserRole.CUSTOMER, joinedAt: new Date() },
          { userId: owner._id, role: UserRole.RESTAURANT_OWNER, joinedAt: new Date() },
        ],
        type: 'order',
        orderId,
        status: 'active',
      });

      await expect(
        Conversation.create({
          participants: [
            { userId: customer._id, role: UserRole.CUSTOMER, joinedAt: new Date() },
            { userId: owner._id, role: UserRole.RESTAURANT_OWNER, joinedAt: new Date() },
          ],
          type: 'order',
          orderId,
          status: 'active',
        }),
      ).rejects.toThrow();
    });
  });

  describe('Message Model', () => {
    it('should create a message', async () => {
      const customer = await createCustomer();
      const owner = await createRestaurantOwner();

      const conversation = await Conversation.create({
        participants: [
          { userId: customer._id, role: UserRole.CUSTOMER, joinedAt: new Date() },
          { userId: owner._id, role: UserRole.RESTAURANT_OWNER, joinedAt: new Date() },
        ],
        type: 'order',
        status: 'active',
      });

      const message = await Message.create({
        conversationId: conversation._id,
        senderId: customer._id,
        senderRole: UserRole.CUSTOMER,
        content: 'Hello, I have a question about my order.',
        messageType: 'text',
        readBy: [{ userId: customer._id, readAt: new Date() }],
      });

      expect(message).toBeDefined();
      expect(message.content).toBe('Hello, I have a question about my order.');
      expect(message.readBy).toHaveLength(1);
    });

    it('should track read receipts', async () => {
      const customer = await createCustomer();
      const owner = await createRestaurantOwner();
      const conversation = await Conversation.create({
        participants: [
          { userId: customer._id, role: UserRole.CUSTOMER, joinedAt: new Date() },
          { userId: owner._id, role: UserRole.RESTAURANT_OWNER, joinedAt: new Date() },
        ],
        type: 'order',
        status: 'active',
      });

      const message = await Message.create({
        conversationId: conversation._id,
        senderId: customer._id,
        senderRole: UserRole.CUSTOMER,
        content: 'Test message',
        messageType: 'text',
        readBy: [{ userId: customer._id, readAt: new Date() }],
      });

      message.readBy.push({ userId: owner._id, readAt: new Date() });
      await message.save();

      const updated = await Message.findById(message._id);
      expect(updated!.readBy).toHaveLength(2);
    });
  });

  describe('Chat Service', () => {
    describe('createConversation', () => {
      it('should create an order conversation', async () => {
        const customer = await createCustomer();
        const owner = await createRestaurantOwner();

        const conv = await createConversation(String(customer._id), UserRole.CUSTOMER, {
          type: 'order',
          participantId: String(owner._id),
          participantRole: UserRole.RESTAURANT_OWNER,
        });

        expect(conv).toBeDefined();
        expect((conv as any).type).toBe('order');
      });

      it('should return existing conversation for the same order', async () => {
        const customer = await createCustomer();
        const owner = await createRestaurantOwner();
        const orderId = new mongoose.Types.ObjectId();

        const conv1 = await createConversation(String(customer._id), UserRole.CUSTOMER, {
          type: 'order',
          orderId: String(orderId),
          participantId: String(owner._id),
          participantRole: UserRole.RESTAURANT_OWNER,
        });

        const conv2 = await createConversation(String(customer._id), UserRole.CUSTOMER, {
          type: 'order',
          orderId: String(orderId),
          participantId: String(owner._id),
          participantRole: UserRole.RESTAURANT_OWNER,
        });

        expect((conv1 as any).id).toBe((conv2 as any).id);
      });
    });

    describe('sendMessage', () => {
      it('should send a message in a conversation', async () => {
        const customer = await createCustomer();
        const owner = await createRestaurantOwner();

        const conv = await createConversation(String(customer._id), UserRole.CUSTOMER, {
          type: 'order',
          participantId: String(owner._id),
          participantRole: UserRole.RESTAURANT_OWNER,
        });

        const message = await sendMessage(
          (conv as any).id,
          String(customer._id),
          UserRole.CUSTOMER,
          'Hello!',
        );

        expect(message).toBeDefined();
        expect((message as any).content).toBe('Hello!');
        expect((message as any).senderRole).toBe(UserRole.CUSTOMER);
      });

      it('should update conversation lastMessage', async () => {
        const customer = await createCustomer();
        const owner = await createRestaurantOwner();

        const conv = await createConversation(String(customer._id), UserRole.CUSTOMER, {
          type: 'order',
          participantId: String(owner._id),
          participantRole: UserRole.RESTAURANT_OWNER,
        });

        await sendMessage(
          (conv as any).id,
          String(customer._id),
          UserRole.CUSTOMER,
          'Last message!',
        );

        const updated = await Conversation.findById((conv as any).id);
        expect(updated!.lastMessage).toBeDefined();
        expect(updated!.lastMessage!.content).toBe('Last message!');
      });

      it('should reject messages from non-participants', async () => {
        const customer = await createCustomer();
        const owner = await createRestaurantOwner();
        const admin = await createAdmin();

        const conv = await createConversation(String(customer._id), UserRole.CUSTOMER, {
          type: 'order',
          participantId: String(owner._id),
          participantRole: UserRole.RESTAURANT_OWNER,
        });

        await expect(
          sendMessage((conv as any).id, String(admin._id), UserRole.ADMIN, 'Should fail'),
        ).rejects.toThrow('Not a participant');
      });
    });

    describe('getConversations', () => {
      it('should list conversations for a user', async () => {
        const customer = await createCustomer();
        const owner = await createRestaurantOwner();

        await createConversation(String(customer._id), UserRole.CUSTOMER, {
          type: 'order',
          participantId: String(owner._id),
          participantRole: UserRole.RESTAURANT_OWNER,
        });

        const result = await getConversations(String(customer._id), UserRole.CUSTOMER, {
          page: 1,
          limit: 20,
        });
        expect(result.conversations).toHaveLength(1);
        expect(result.pagination.total).toBe(1);
      });

      it('should return empty list for user with no conversations', async () => {
        const admin = await createAdmin();
        const result = await getConversations(String(admin._id), UserRole.ADMIN, {
          page: 1,
          limit: 20,
        });
        expect(result.conversations).toHaveLength(0);
        expect(result.pagination.total).toBe(0);
      });
    });

    describe('getMessages', () => {
      it('should return paginated messages', async () => {
        const customer = await createCustomer();
        const owner = await createRestaurantOwner();

        const conv = await createConversation(String(customer._id), UserRole.CUSTOMER, {
          type: 'order',
          participantId: String(owner._id),
          participantRole: UserRole.RESTAURANT_OWNER,
        });

        await sendMessage((conv as any).id, String(customer._id), UserRole.CUSTOMER, 'Message 1');
        await sendMessage(
          (conv as any).id,
          String(owner._id),
          UserRole.RESTAURANT_OWNER,
          'Message 2',
        );

        const result = await getMessages((conv as any).id, String(customer._id), {
          page: 1,
          limit: 50,
        });
        expect(result.messages).toHaveLength(2);
        expect(result.pagination.total).toBe(2);
      });

      it('should reject access for non-participants', async () => {
        const customer = await createCustomer();
        const owner = await createRestaurantOwner();
        const admin = await createAdmin();

        const conv = await createConversation(String(customer._id), UserRole.CUSTOMER, {
          type: 'order',
          participantId: String(owner._id),
          participantRole: UserRole.RESTAURANT_OWNER,
        });

        await expect(
          getMessages((conv as any).id, String(admin._id), { page: 1, limit: 50 }),
        ).rejects.toThrow('Not a participant');
      });
    });

    describe('markConversationRead', () => {
      it('should mark unread messages as read', async () => {
        const customer = await createCustomer();
        const owner = await createRestaurantOwner();

        const conv = await createConversation(String(customer._id), UserRole.CUSTOMER, {
          type: 'order',
          participantId: String(owner._id),
          participantRole: UserRole.RESTAURANT_OWNER,
        });

        await sendMessage((conv as any).id, String(customer._id), UserRole.CUSTOMER, 'Hi');

        const result = await markConversationRead((conv as any).id, String(owner._id));
        expect(result.modifiedCount).toBe(1);
      });
    });

    describe('createTestData / clearTestData', () => {
      it('should create and clear test data', async () => {
        const admin = await createAdmin();

        const testResult = await createTestData(String(admin._id), 'support');
        expect(testResult.conversation).toBeDefined();

        const clearResult = await clearTestData(String(admin._id));
        expect(clearResult.removedCount).toBeGreaterThanOrEqual(1);

        const convs = await getConversations(String(admin._id), UserRole.ADMIN, {
          page: 1,
          limit: 20,
        });
        expect(convs.conversations).toHaveLength(0);
      });
    });
  });
});
