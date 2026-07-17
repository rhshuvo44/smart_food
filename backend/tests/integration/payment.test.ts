jest.mock('expo-server-sdk', () => ({
  Expo: jest.fn().mockImplementation(() => ({
    sendPushNotificationsAsync: jest.fn().mockResolvedValue([]),
    getPushNotificationReceiptsAsync: jest.fn().mockResolvedValue({}),
  })),
}));

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { Payment } from '../../src/models/index.js';

jest.mock('stripe', () => {
  const paymentIntents = { create: jest.fn(), retrieve: jest.fn() };
  const refunds = { create: jest.fn() };
  const webhooks = { constructEvent: jest.fn() };

  const mockInstance = { paymentIntents, refunds, webhooks };

  return jest.fn().mockImplementation(() => mockInstance);
});

let mongoServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;
let accessToken: string;
let userId: string;

function getMockStripe() {
  const Stripe = require('stripe');
  return Stripe();
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: { dbName: 'smartfood_test' },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  app = createApp();
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

async function registerAndLogin() {
  const email = `payment-test-${Date.now()}@example.com`;
  const res = await request(app).post('/api/v1/auth/register').send({
    email,
    password: 'Password123',
    firstName: 'Payment',
    lastName: 'Tester',
  });
  accessToken = res.body.data.tokens.accessToken;
  userId = res.body.data.user.id;
}

describe('Payment API Integration', () => {
  beforeEach(async () => {
    await registerAndLogin();
  });

  describe('POST /api/v1/payments/create-intent', () => {
    it('creates a Stripe payment intent', async () => {
      const orderId = new mongoose.Types.ObjectId().toString();

      const stripe = getMockStripe();
      stripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_integration_test',
        client_secret: 'secret_integration_test',
        amount: 4082,
        currency: 'usd',
        status: 'requires_payment_method',
      });

      const res = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          orderId,
          amount: 40.82,
          currency: 'USD',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.payment).toBeDefined();
      expect(res.body.data.payment.stripePaymentIntentId).toBe('pi_integration_test');
      expect(res.body.data.payment.amount).toBe(40.82);
      expect(res.body.data.payment.status).toBe('pending');
      expect(res.body.data.publishableKey).toBeDefined();
    });

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/v1/payments/create-intent')
        .send({ orderId: new mongoose.Types.ObjectId().toString(), amount: 10, currency: 'USD' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/payments/order/:orderId', () => {
    it('returns the payment for an order', async () => {
      const orderId = new mongoose.Types.ObjectId().toString();
      const customerId = new mongoose.Types.ObjectId(userId);

      await Payment.create({
        orderId: new mongoose.Types.ObjectId(orderId),
        customerId,
        amount: 40.82,
        currency: 'USD',
        status: 'completed' as any,
        stripePaymentIntentId: 'pi_get_test',
        gateway: 'stripe' as any,
      });

      const res = await request(app)
        .get(`/api/v1/payments/order/${orderId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.payment).toBeDefined();
    });

    it('returns 404 for non-existent payment', async () => {
      const res = await request(app)
        .get(`/api/v1/payments/order/${new mongoose.Types.ObjectId().toString()}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });
});
