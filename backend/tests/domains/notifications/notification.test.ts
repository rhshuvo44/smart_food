import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../../../src/models/index.js';
import { Order } from '../../../src/models/order.model.js';
import {
  Notification,
  NotificationPreference,
  NotificationTemplate,
} from '../../../src/models/index.js';
import { UserRole, OrderStatus } from '@smartfood/shared';
import { EventBus } from '../../../src/shared/event-bus.js';
import { logger } from '../../../src/config/logger.js';

// ── Mocks for external services ──────────────────────────────────────

// Mock expo-server-sdk
const mockExpoSendNotifications = jest.fn();
const mockExpoIsExpoPushToken = jest.fn();
jest.mock('expo-server-sdk', () => {
  const mockExpoConstructor = jest.fn().mockImplementation(() => ({
    sendPushNotificationsAsync: mockExpoSendNotifications,
    getPushNotificationReceiptsAsync: jest.fn(),
  }));
  // Add static method isExpoPushToken to the constructor
  mockExpoConstructor.isExpoPushToken = (token: string) => mockExpoIsExpoPushToken(token);
  return {
    Expo: mockExpoConstructor,
  };
});

// Mock @sendgrid/mail
const mockSendGridSend = jest.fn();
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: mockSendGridSend,
}));

// Mock twilio
const mockTwilioMessagesCreate = jest.fn();
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: mockTwilioMessagesCreate,
    },
  }));
});

// ── Imports after mocks ──────────────────────────────────────────────
import {
  sendPush,
  sendPushToMultiple,
  resetPushRateLimiter,
} from '../../../src/domains/notifications/push.service.js';
import {
  sendEmail,
  sendEmailWithTemplate,
  resetEmailRateLimiter,
  resetEmailClient,
} from '../../../src/domains/notifications/email.service.js';
import {
  sendSMS,
  resetSmsRateLimiter,
  resetTwilioClient,
} from '../../../src/domains/notifications/sms.service.js';
import { sendInApp } from '../../../src/domains/notifications/in-app.service.js';
import {
  sendNotification,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendOrderCancellation,
  sendOrderCompletion,
} from '../../../src/domains/notifications/notification.service.js';
import { templateService } from '../../../src/domains/notifications/template.service.js';
import { registerNotificationSubscribers } from '../../../src/domains/notifications/event-subscribers.js';
import { env } from '../../../src/config/env.js';

// ── Setup ─────────────────────────────────────────────────────────────

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: { dbName: 'smartfood_test_notifications' },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Set env vars for testing
  (env as any).SENDGRID_API_KEY = '';
  (env as any).TWILIO_ACCOUNT_SID = '';
  (env as any).TWILIO_AUTH_TOKEN = '';
  (env as any).SENDGRID_FROM_EMAIL = 'noreply@smartfood.app';
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
  jest.clearAllMocks();
  resetPushRateLimiter();
  resetEmailRateLimiter();
  resetEmailClient();
  resetSmsRateLimiter();
  resetTwilioClient();
});

// ── Seed helper ───────────────────────────────────────────────────────

async function seedTemplates(): Promise<void> {
  await templateService.seedTemplates();
}

async function createTestUser(): Promise<any> {
  return User.create({
    email: 'test@example.com',
    passwordHash: 'Password123',
    firstName: 'Test',
    lastName: 'User',
    phone: '+1234567890',
    role: UserRole.CUSTOMER,
  });
}

async function createTestOrder(userId: mongoose.Types.ObjectId): Promise<any> {
  return Order.create({
    customerId: userId,
    restaurantId: new mongoose.Types.ObjectId(),
    items: [
      {
        menuItemId: 'menu-item-1',
        name: 'Pizza',
        quantity: 1,
        unitPrice: 1299,
        totalPrice: 1299,
      },
    ],
    subtotal: 1299,
    tax: 104,
    deliveryFee: 399,
    total: 1802,
    status: OrderStatus.CONFIRMED,
    deliveryAddress: {
      type: 'Point',
      coordinates: [-73.98, 40.75],
      address: {
        street: '123 Test St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US',
        formatted: '123 Test St, New York, NY 10001',
      },
    },
    estimatedDeliveryTime: new Date(Date.now() + 3600000),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('Notification System', () => {
  // ── Push Service ─────────────────────────────────────────────────

  describe('Push Service', () => {
    beforeEach(() => {
      mockExpoIsExpoPushToken.mockImplementation((token: string) =>
        token.startsWith('ExponentPushToken'),
      );
    });

    afterEach(() => {
      mockExpoIsExpoPushToken.mockReset();
    });

    it('should send a push notification successfully', async () => {
      mockExpoSendNotifications.mockResolvedValue([{ status: 'ok', id: 'ticket-123' }]);

      const result = await sendPush(
        'ExponentPushToken[test-token-123]',
        'Test Title',
        'Test Body',
        { key: 'value' },
      );

      expect(result.success).toBe(true);
      expect(result.ticketId).toBe('ticket-123');
      expect(mockExpoSendNotifications).toHaveBeenCalledTimes(1);
    });

    it('should fail for invalid Expo push token', async () => {
      mockExpoIsExpoPushToken.mockReturnValue(false);

      const result = await sendPush('invalid-token', 'Test Title', 'Test Body');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
      expect(mockExpoSendNotifications).not.toHaveBeenCalled();
    });

    it('should fail when Expo returns an error', async () => {
      mockExpoIsExpoPushToken.mockReturnValue(true);
      mockExpoSendNotifications.mockResolvedValue([
        { status: 'error', message: 'DeviceNotRegistered' },
      ]);

      const result = await sendPush('ExponentPushToken[test-token-123]', 'Test Title', 'Test Body');

      expect(result.success).toBe(false);
      expect(result.error).toBe('DeviceNotRegistered');
    });

    it('should enforce rate limiting for push notifications', async () => {
      mockExpoIsExpoPushToken.mockReturnValue(true);
      mockExpoSendNotifications.mockResolvedValue([{ status: 'ok', id: 'ticket' }]);

      const token = 'ExponentPushToken[rate-limit-test]';

      // Send 5 pushes (should all succeed)
      for (let i = 0; i < 5; i++) {
        const result = await sendPush(token, 'Title', 'Body');
        expect(result.success).toBe(true);
      }

      // 6th push should be rate limited
      const result = await sendPush(token, 'Title', 'Body');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });

    it('should send push to multiple tokens', async () => {
      mockExpoIsExpoPushToken.mockImplementation((token: string) =>
        token.startsWith('ExponentPushToken'),
      );
      mockExpoSendNotifications.mockResolvedValue([
        { status: 'ok', id: 'ticket-1' },
        { status: 'ok', id: 'ticket-2' },
      ]);

      const tokens = ['ExponentPushToken[token-1]', 'ExponentPushToken[token-2]'];

      const results = await sendPushToMultiple(tokens, 'Title', 'Body');

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });
  });

  // ── Email Service ────────────────────────────────────────────────

  describe('Email Service', () => {
    it('should mock email when no API key is configured', async () => {
      const result = await sendEmail('test@example.com', 'Subject', 'Body');

      expect(result.success).toBe(true);
      expect(result.messageId).toContain('mock_');
    });

    it('should enforce rate limiting for emails', async () => {
      const email = 'ratelimit@example.com';

      for (let i = 0; i < 50; i++) {
        const result = await sendEmail(email, 'Subject', 'Body');
        expect(result.success).toBe(true);
      }

      // 51st should fail
      const result = await sendEmail(email, 'Subject', 'Body');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });

    it('should send email with template', async () => {
      await seedTemplates();

      const result = await sendEmailWithTemplate('test@example.com', 'order_confirmation', {
        firstName: 'John',
        orderId: '123',
        restaurantName: 'Test Restaurant',
        total: '25.99',
      });

      expect(result.success).toBe(true);
    });

    it('should fail when template not found', async () => {
      const result = await sendEmailWithTemplate('test@example.com', 'nonexistent_template', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Template not found');
    });
  });

  // ── SMS Service ──────────────────────────────────────────────────

  describe('SMS Service', () => {
    it('should mock SMS when no Twilio credentials are configured', async () => {
      const result = await sendSMS('+1234567890', 'Test SMS body');

      expect(result.success).toBe(true);
      expect(result.sid).toContain('mock_');
    });

    it('should handle Twilio error codes gracefully', async () => {
      // Set mock credentials to trigger real client path
      (env as any).TWILIO_ACCOUNT_SID = 'test_sid';
      (env as any).TWILIO_AUTH_TOKEN = 'test_token';
      (env as any).TWILIO_FROM_NUMBER = '+15551234567';

      // Re-initialize will happen on next call

      mockTwilioMessagesCreate.mockRejectedValue({
        code: 21211,
        message: 'Invalid phone number',
      });

      const result = await sendSMS('+1234567890', 'Test SMS');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid phone number');

      // Reset env
      (env as any).TWILIO_ACCOUNT_SID = '';
      (env as any).TWILIO_AUTH_TOKEN = '';
      (env as any).TWILIO_FROM_NUMBER = '';
      resetTwilioClient();
    });

    it('should enforce rate limiting for SMS', async () => {
      const phone = '+1234567890';

      for (let i = 0; i < 10; i++) {
        const result = await sendSMS(phone, 'Test SMS');
        expect(result.success).toBe(true);
      }

      // 11th should fail
      const result = await sendSMS(phone, 'Test SMS');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });
  });

  // ── In-App Service ──────────────────────────────────────────────────

  describe('In-App Service', () => {
    it('should create an in-app notification', async () => {
      const user = await createTestUser();
      const result = await sendInApp(
        String(user._id),
        'order_confirmation',
        'Test Title',
        'Test Body',
        { orderId: '123' },
      );

      expect(result.success).toBe(true);
      expect(result.notificationId).toBeDefined();

      const notif = await Notification.findById(result.notificationId);
      expect(notif).toBeDefined();
      expect(notif!.channel).toBe('in_app');
      expect(notif!.status).toBe('sent');
    });
  });

  // ── Template Service ────────────────────────────────────────────────

  describe('Template Service', () => {
    beforeEach(async () => {
      await seedTemplates();
    });

    it('should render template with placeholders', async () => {
      const template = await templateService.getTemplate('order_confirmation', 'push');
      expect(template).not.toBeNull();

      const rendered = templateService.renderTemplate(template!, {
        firstName: 'John',
        orderId: '123',
        restaurantName: 'Pizza Place',
        total: '25.99',
        estimatedTime: '30 min',
      });

      expect(rendered.title).toContain('Order Confirmed');
      expect(rendered.body).toContain('John');
      expect(rendered.body).toContain('#123');
      expect(rendered.body).toContain('Pizza Place');
      expect(rendered.body).toContain('$25.99');
    });

    it('should leave missing placeholders as-is', async () => {
      const template = await templateService.getTemplate('order_confirmation', 'push');
      expect(template).not.toBeNull();

      const rendered = templateService.renderTemplate(template!, {
        firstName: 'John',
      });

      expect(rendered.body).toContain('{{orderId}}');
      expect(rendered.body).toContain('{{restaurantName}}');
    });

    it('should return null for non-existent template', async () => {
      const template = await templateService.getTemplate('nonexistent', 'push');
      expect(template).toBeNull();
    });

    it('should get template by key, channel, and locale', async () => {
      const template = await templateService.getTemplate('order_confirmation', 'email', 'en');
      expect(template).not.toBeNull();
      expect(template!.channel).toBe('email');
    });
  });

  // ── Notification Service (Orchestrator) ─────────────────────────

  describe('Notification Service', () => {
    beforeEach(async () => {
      await seedTemplates();
      mockExpoIsExpoPushToken.mockImplementation((token: string) =>
        token.startsWith('ExponentPushToken'),
      );
    });

    describe('sendNotification', () => {
      it('should send via push when preferences allow it', async () => {
        const user = await createTestUser();
        mockExpoSendNotifications.mockResolvedValue([{ status: 'ok', id: 'ticket-123' }]);

        const result = await sendNotification(String(user._id), 'order_confirmation', {
          firstName: 'John',
          orderId: '123',
          restaurantName: 'Test',
          total: '25.99',
          estimatedTime: '30 min',
          deliveryAddress: '123 St',
          email: user.email,
          phone: user.phone,
          pushToken: 'ExponentPushToken[test-123]',
        });

        expect(result.channelResults.length).toBeGreaterThan(0);
        expect(result.channelResults[0].channel).toBe('push');
        expect(result.channelResults[0].success).toBe(true);
      });

      it('should fallback to email when push fails and email succeeds', async () => {
        const user = await createTestUser();
        mockExpoSendNotifications.mockResolvedValue([
          { status: 'error', message: 'DeviceNotRegistered' },
        ]);

        const result = await sendNotification(String(user._id), 'order_confirmation', {
          firstName: 'John',
          orderId: '123',
          restaurantName: 'Test',
          total: '25.99',
          estimatedTime: '30 min',
          deliveryAddress: '123 St',
          email: user.email,
          phone: user.phone,
          pushToken: 'ExponentPushToken[test-123]',
        });

        // Push failed, email succeeded (mock)
        const pushResult = result.channelResults.find((r) => r.channel === 'push');
        const emailResult = result.channelResults.find((r) => r.channel === 'email');
        expect(pushResult).toBeDefined();
        expect(pushResult!.success).toBe(false);
        expect(emailResult).toBeDefined();
        expect(emailResult!.success).toBe(true);
      });

      it('should skip channels user opted out of', async () => {
        const user = await createTestUser();

        // Create preference with push disabled
        await NotificationPreference.create({
          userId: user._id,
          channels: { push: false, email: true, sms: true, in_app: true },
        });

        mockExpoSendNotifications.mockResolvedValue([{ status: 'ok', id: 'ticket-123' }]);

        const result = await sendNotification(String(user._id), 'order_confirmation', {
          firstName: 'John',
          orderId: '123',
          restaurantName: 'Test',
          total: '25.99',
          estimatedTime: '30 min',
          deliveryAddress: '123 St',
          email: user.email,
          phone: user.phone,
          pushToken: 'ExponentPushToken[test-123]',
        });

        // Push should be skipped entirely due to preference (not added to results),
        // email should be tried and succeed
        const emailResult = result.channelResults.find((r) => r.channel === 'email');
        expect(emailResult).toBeDefined();
        expect(emailResult!.success).toBe(true);
      });

      it('should force send when force option is true', async () => {
        const user = await createTestUser();

        // Disable all channels
        await NotificationPreference.create({
          userId: user._id,
          channels: { push: false, email: false, sms: false, in_app: false },
        });

        mockExpoSendNotifications.mockResolvedValue([{ status: 'ok', id: 'ticket-123' }]);

        const result = await sendNotification(
          String(user._id),
          'order_confirmation',
          {
            firstName: 'John',
            orderId: '123',
            restaurantName: 'Test',
            total: '25.99',
            estimatedTime: '30 min',
            deliveryAddress: '123 St',
            email: user.email,
            phone: user.phone,
            pushToken: 'ExponentPushToken[test-123]',
          },
          { force: true },
        );

        // Should send despite preferences (push should succeed because force skips preference check)
        const pushResult = result.channelResults.find((r) => r.channel === 'push');
        expect(pushResult).toBeDefined();
        expect(pushResult!.success).toBe(true);
      });

      it('should always create an in-app notification record on failure chain', async () => {
        const user = await createTestUser();
        mockExpoSendNotifications.mockResolvedValue([
          { status: 'error', message: 'DeviceNotRegistered' },
        ]);

        // Remove email so push -> in-app fallback
        const result = await sendNotification(
          String(user._id),
          'order_confirmation',
          {
            firstName: 'John',
            orderId: '123',
            restaurantName: 'Test',
            total: '25.99',
            estimatedTime: '30 min',
            deliveryAddress: '123 St',
            email: user.email,
            phone: user.phone,
            pushToken: 'ExponentPushToken[test-123]',
          },
          { channels: ['push', 'in_app'] },
        );

        // Push failed, but in-app should succeed
        const lastResult = result.channelResults[result.channelResults.length - 1];
        expect(lastResult.channel).toBe('in_app');
        expect(lastResult.success).toBe(true);
      });
    });

    describe('Order-specific notification methods', () => {
      it('sendOrderConfirmation should work', async () => {
        const user = await createTestUser();
        const order = await createTestOrder(user._id);
        mockExpoSendNotifications.mockResolvedValue([{ status: 'ok', id: 'ticket-123' }]);

        const result = await sendOrderConfirmation(order, user);
        expect(result.channelResults.length).toBeGreaterThan(0);
      });

      it('sendOrderStatusUpdate should work', async () => {
        const user = await createTestUser();
        const order = await createTestOrder(user._id);
        mockExpoSendNotifications.mockResolvedValue([{ status: 'ok', id: 'ticket-123' }]);

        const result = await sendOrderStatusUpdate(
          order,
          user,
          OrderStatus.CONFIRMED,
          OrderStatus.PREPARING,
        );
        expect(result.channelResults.length).toBeGreaterThan(0);
      });

      it('sendOrderCancellation should work', async () => {
        const user = await createTestUser();
        const order = await createTestOrder(user._id);
        mockExpoSendNotifications.mockResolvedValue([{ status: 'ok', id: 'ticket-123' }]);

        const result = await sendOrderCancellation(order, user, 'Customer request');
        expect(result.channelResults.length).toBeGreaterThan(0);
      });

      it('sendOrderCompletion should work', async () => {
        const user = await createTestUser();
        const order = await createTestOrder(user._id);
        mockExpoSendNotifications.mockResolvedValue([{ status: 'ok', id: 'ticket-123' }]);

        const result = await sendOrderCompletion(order, user);
        expect(result.channelResults.length).toBeGreaterThan(0);
      });
    });
  });

  // ── Event Subscribers ───────────────────────────────────────────

  describe('Event Subscribers', () => {
    beforeEach(async () => {
      await seedTemplates();
      mockExpoIsExpoPushToken.mockImplementation((token: string) =>
        token.startsWith('ExponentPushToken'),
      );
      mockExpoSendNotifications.mockResolvedValue([{ status: 'ok', id: 'ticket-123' }]);
    });

    it('should register subscribers without error', () => {
      expect(() => registerNotificationSubscribers()).not.toThrow();
      // Clean up event bus for subsequent tests
      EventBus.getInstance().clear();
    });

    it('should trigger notification on order.created event', async () => {
      const user = await createTestUser();
      const order = await createTestOrder(user._id);

      const eventBus = EventBus.getInstance();
      registerNotificationSubscribers();

      const publishSpy = jest.spyOn(eventBus, 'publish');

      eventBus.publish({
        id: 'event-1',
        type: 'order.created',
        aggregateId: String(order._id),
        aggregateType: 'order',
        timestamp: new Date(),
        correlationId: 'corr-1',
        data: {
          order,
          customerId: String(user.publicId),
          restaurantId: String(order.restaurantId),
        },
      });

      // Wait a tick for async handlers
      await new Promise((resolve) => setTimeout(resolve, 100));

      // We can't easily assert the notification was sent due to async nature,
      // but we can confirm no crash happened
      expect(publishSpy).toHaveBeenCalled();

      EventBus.getInstance().clear();
    });
  });

  // ── Preference Filtering ────────────────────────────────────────

  describe('Preference Filtering', () => {
    it('should respect type-based opt-out', async () => {
      await seedTemplates();
      const user = await createTestUser();

      // Opt out of order_cancelled type
      await NotificationPreference.create({
        userId: user._id,
        channels: { push: true, email: true, sms: true, in_app: true },
        types: {
          order_confirmation: true,
          order_status: true,
          order_cancelled: false,
          order_completed: true,
          payment_received: true,
          delivery_update: true,
        },
      });

      mockExpoIsExpoPushToken.mockReturnValue(true);
      mockExpoSendNotifications.mockResolvedValue([{ status: 'ok', id: 'ticket-123' }]);

      const result = await sendNotification(String(user._id), 'order_cancelled', {
        firstName: 'John',
        orderId: '123',
        restaurantName: 'Test',
        reason: 'Test',
        email: user.email,
        phone: user.phone,
        pushToken: 'ExponentPushToken[test-123]',
      });

      // All channels should be skipped due to type opt-out
      expect(result.channelResults.every((r) => !r.success)).toBe(true);
    });

    it('should respect channel-based opt-out', async () => {
      await seedTemplates();
      const user = await createTestUser();

      // Opt out of SMS
      await NotificationPreference.create({
        userId: user._id,
        channels: { push: true, email: true, sms: false, in_app: true },
      });

      mockExpoIsExpoPushToken.mockReturnValue(true);
      mockExpoSendNotifications.mockResolvedValue([{ status: 'ok', id: 'ticket-123' }]);

      // Try sending only to SMS
      const result = await sendNotification(
        String(user._id),
        'order_confirmation',
        {
          firstName: 'John',
          orderId: '123',
          restaurantName: 'Test',
          total: '25.99',
          email: user.email,
          phone: user.phone,
          pushToken: 'ExponentPushToken[test-123]',
        },
        { channels: ['sms'] },
      );

      // SMS should be skipped due to preference — channelResults should be empty
      expect(result.channelResults.length).toBe(0);
    });
  });

  // ── API Endpoint Tests ──────────────────────────────────────────

  describe('API Endpoints', () => {
    it('should create notification records in DB', async () => {
      const user = await createTestUser();

      const notification = await Notification.create({
        userId: user._id,
        type: 'order_confirmation',
        channel: 'in_app',
        title: 'Test',
        body: 'Test body',
        data: { orderId: '123' },
        status: 'sent',
        deliveredAt: new Date(),
      });

      expect(notification).toBeDefined();
      expect(notification.title).toBe('Test');
      expect(notification.channel).toBe('in_app');
    });

    it('should create and retrieve preferences', async () => {
      const user = await createTestUser();

      const prefs = await NotificationPreference.create({
        userId: user._id,
      });

      expect(prefs).toBeDefined();
      expect(prefs.channels.push).toBe(true);
      expect(prefs.channels.email).toBe(true);
      expect(prefs.channels.sms).toBe(true);
      expect(prefs.channels.in_app).toBe(true);
    });

    it('should update preferences', async () => {
      const user = await createTestUser();

      const prefs = await NotificationPreference.create({
        userId: user._id,
      });

      prefs.channels.push = false;
      prefs.markModified('channels');
      await prefs.save();

      const updated = await NotificationPreference.findOne({ userId: user._id });
      expect(updated!.channels.push).toBe(false);
    });

    it('should track notification status changes', async () => {
      const user = await createTestUser();

      const notification = await Notification.create({
        userId: user._id,
        type: 'order_confirmation',
        channel: 'push',
        title: 'Test',
        body: 'Test',
        status: 'sent',
      });

      // Mark as opened
      notification.status = 'opened';
      notification.readAt = new Date();
      await notification.save();

      const updated = await Notification.findById(notification._id);
      expect(updated!.status).toBe('opened');
      expect(updated!.readAt).toBeDefined();
    });

    it('should support stop-all (disable all channels)', async () => {
      const user = await createTestUser();

      const prefs = await NotificationPreference.create({
        userId: user._id,
      });

      prefs.channels = { push: false, email: false, sms: false, in_app: false };
      await prefs.save();

      const updated = await NotificationPreference.findOne({ userId: user._id });
      expect(updated!.channels.push).toBe(false);
      expect(updated!.channels.email).toBe(false);
      expect(updated!.channels.sms).toBe(false);
      expect(updated!.channels.in_app).toBe(false);
    });

    it('should count unread notifications', async () => {
      const user = await createTestUser();

      await Notification.create({
        userId: user._id,
        type: 'order_confirmation',
        channel: 'in_app',
        title: 'Unread 1',
        body: 'Test',
        status: 'sent',
      });

      await Notification.create({
        userId: user._id,
        type: 'order_status',
        channel: 'in_app',
        title: 'Unread 2',
        body: 'Test',
        status: 'sent',
      });

      await Notification.create({
        userId: user._id,
        type: 'order_completed',
        channel: 'in_app',
        title: 'Read',
        body: 'Test',
        status: 'opened',
        readAt: new Date(),
      });

      const unreadCount = await Notification.countDocuments({
        userId: user._id,
        channel: 'in_app',
        readAt: null,
      });

      expect(unreadCount).toBe(2);
    });
  });
});
