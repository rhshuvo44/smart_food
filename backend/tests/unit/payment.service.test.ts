import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Payment, User } from '../../src/models/index.js';
import { PaymentStatus } from '@smartfood/shared';

const mockPaymentIntents = {
  create: jest.fn(),
};

const mockRefunds = {
  create: jest.fn(),
};

jest.mock('stripe', () => {
  const paymentIntents = { create: jest.fn() };
  const refunds = { create: jest.fn() };

  const mockInstance = {
    paymentIntents,
    refunds,
    webhooks: { constructEvent: jest.fn() },
  };

  (mockInstance as any).__paymentIntents = paymentIntents;
  (mockInstance as any).__refunds = refunds;

  return jest.fn().mockImplementation(() => mockInstance);
});

import {
  createPaymentIntent,
  handleStripeWebhook,
  refundPayment,
} from '../../src/domains/payment/payment.service.js';

let mongoServer: MongoMemoryServer;

function getMockStripe() {
  const Stripe = require('stripe');
  const instance = Stripe();
  return instance;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: { dbName: 'smartfood_test' },
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
  jest.clearAllMocks();
});

describe('Payment Service', () => {
  describe('createPaymentIntent', () => {
    it('creates a payment intent and payment record', async () => {
      const user = await User.create({
        email: 'test-payment@example.com',
        passwordHash: 'Password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
      });

      const orderId = new mongoose.Types.ObjectId().toString();
      const customerPublicId = user.publicId;
      const amount = 25.99;

      const stripe = getMockStripe();
      stripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'secret_test123',
        amount: 2599,
        currency: 'usd',
        status: 'requires_payment_method',
      });

      const payment = await createPaymentIntent(orderId, customerPublicId, amount, 'USD');

      expect(payment).toBeDefined();
      expect(payment.amount).toBe(25.99);
      expect(payment.currency).toBe('USD');
      expect(payment.status).toBe(PaymentStatus.PENDING);
      expect(payment.stripePaymentIntentId).toBe('pi_test123');
      expect(payment.stripeClientSecret).toBe('secret_test123');
      expect(payment.orderId.toString()).toBe(orderId);
      expect(payment.customerId.toString()).toBe(user._id.toString());

      expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 2599,
        currency: 'usd',
        metadata: { orderId, customerId: user._id.toString() },
        automatic_payment_methods: { enabled: true },
      });
    });

    it('reuses existing payment if stripePaymentIntentId exists', async () => {
      const user = await User.create({
        email: 'test-payment2@example.com',
        passwordHash: 'Password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
      });

      const orderId = new mongoose.Types.ObjectId().toString();
      const customerId = user._id;

      await Payment.create({
        orderId: new mongoose.Types.ObjectId(orderId),
        customerId,
        amount: 10,
        currency: 'USD',
        status: PaymentStatus.PENDING,
        stripePaymentIntentId: 'pi_existing',
        stripeClientSecret: 'secret_existing',
        gateway: 'stripe',
      });

      const stripe = getMockStripe();
      stripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_new',
        client_secret: 'secret_new',
      });

      const payment = await createPaymentIntent(orderId, user.publicId, 10, 'USD');

      expect(payment.stripePaymentIntentId).toBe('pi_existing');
      expect(stripe.paymentIntents.create).not.toHaveBeenCalled();
    });
  });

  describe('handleStripeWebhook', () => {
    it('marks payment as completed on payment_intent.succeeded', async () => {
      const orderId = new mongoose.Types.ObjectId();
      const customerId = new mongoose.Types.ObjectId();

      const payment = await Payment.create({
        orderId,
        customerId,
        amount: 50,
        currency: 'USD',
        status: PaymentStatus.PROCESSING,
        stripePaymentIntentId: 'pi_success',
        gateway: 'stripe',
      });

      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_success',
            payment_method: 'pm_card',
            amount: 5000,
          },
        },
      };

      await handleStripeWebhook(mockEvent as any);

      const updated = await Payment.findById(payment._id);
      expect(updated!.status).toBe(PaymentStatus.COMPLETED);
      expect(updated!.paymentMethod).toBe('pm_card');
    });

    it('marks payment as failed on payment_intent.payment_failed', async () => {
      const orderId = new mongoose.Types.ObjectId();
      const customerId = new mongoose.Types.ObjectId();

      const payment = await Payment.create({
        orderId,
        customerId,
        amount: 50,
        currency: 'USD',
        status: PaymentStatus.PROCESSING,
        stripePaymentIntentId: 'pi_fail',
        gateway: 'stripe',
      });

      const mockEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_fail',
            last_payment_error: { message: 'Card declined' },
          },
        },
      };

      await handleStripeWebhook(mockEvent as any);

      const updated = await Payment.findById(payment._id);
      expect(updated!.status).toBe(PaymentStatus.FAILED);
      expect(updated!.failureReason).toBe('Card declined');
    });
  });

  describe('refundPayment', () => {
    it('processes a full refund', async () => {
      const orderId = new mongoose.Types.ObjectId();
      const customerId = new mongoose.Types.ObjectId();

      const payment = await Payment.create({
        orderId,
        customerId,
        amount: 100,
        currency: 'USD',
        status: PaymentStatus.COMPLETED,
        stripePaymentIntentId: 'pi_refund',
        gateway: 'stripe',
      });

      const stripe = getMockStripe();
      stripe.refunds.create.mockResolvedValue({
        id: 're_test123',
        status: 'succeeded',
      });

      const result = await refundPayment(payment._id.toString(), undefined, 'duplicate');

      expect(result.status).toBe(PaymentStatus.REFUNDED);
      expect(result.refundAmount).toBe(100);
      expect(result.refundReason).toBe('duplicate');
      expect(stripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_refund',
        amount: undefined,
        reason: 'duplicate',
        metadata: { paymentId: payment._id.toString() },
      });
    });
  });
});
