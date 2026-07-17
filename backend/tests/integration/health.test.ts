jest.mock('expo-server-sdk', () => ({
  Expo: jest.fn().mockImplementation(() => ({
    sendPushNotificationsAsync: jest.fn().mockResolvedValue([]),
    getPushNotificationReceiptsAsync: jest.fn().mockResolvedValue({}),
  })),
}));

import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('Health Check Integration', () => {
  const app = createApp();

  describe('GET /api/v1/health', () => {
    it('returns 200 with healthy status', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.status).toBe('healthy');
      expect(res.body.data.environment).toBeDefined();
      expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
      expect(res.body.data.timestamp).toBeDefined();
      expect(res.body.correlationId).toBeDefined();
    });

    it('returns a unique correlationId on each request', async () => {
      const res1 = await request(app).get('/api/v1/health');
      const res2 = await request(app).get('/api/v1/health');
      expect(res1.body.correlationId).not.toBe(res2.body.correlationId);
    });
  });

  describe('404 handling', () => {
    it('returns 404 with error envelope', async () => {
      const res = await request(app).get('/api/v1/nonexistent').expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBeDefined();
      expect(res.body.correlationId).toBeDefined();
    });
  });
});
