import crypto from 'crypto';
import { z } from 'zod';

function generateSecret(label: string): string {
  if (process.env.NODE_ENV === 'production') {
    console.error(`FATAL: ${label} must be set in production`);
    process.exit(1);
  }
  const secret = crypto.randomBytes(64).toString('hex');
  console.warn(
    `WARNING: ${label} not set. Using auto-generated dev secret. This will invalidate sessions on restart.`,
  );
  return secret;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/smart_food'),
  JWT_ACCESS_SECRET: z.string().min(32).default(() => generateSecret('JWT_ACCESS_SECRET')),
  JWT_REFRESH_SECRET: z.string().min(32).default(() => generateSecret('JWT_REFRESH_SECRET')),
  CLIENT_URL: z.string().default('http://localhost:8081'),
  APP_BASE_URL: z.string().default('http://localhost:5000'),
  CORS_ORIGIN: z.string().default('http://localhost:8081'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  STRIPE_SECRET_KEY: z.string().default('sk_test_placeholder'),
  STRIPE_WEBHOOK_SECRET: z.string().default('whsec_placeholder'),
  STRIPE_PUBLISHABLE_KEY: z.string().default('pk_test_placeholder'),
  SSLCOMMERZ_STORE_ID: z.string().default('testbox'),
  SSLCOMMERZ_STORE_PASSWORD: z.string().default('testbox123'),
  SSLCOMMERZ_BASE_URL: z.string().default('https://sandbox.sslcommerz.com'),
  PAYMENT_GATEWAY: z.enum(['stripe', 'sslcommerz', 'both']).default('both'),

  // Notifications
  EXPO_ACCESS_TOKEN: z.string().default(''),
  SENDGRID_API_KEY: z.string().default(''),
  SENDGRID_FROM_EMAIL: z.string().email().default('noreply@smartfood.app'),
  TWILIO_ACCOUNT_SID: z.string().default(''),
  TWILIO_AUTH_TOKEN: z.string().default(''),
  TWILIO_FROM_NUMBER: z.string().default(''),
  DEFAULT_NOTIFICATION_CHANNEL: z.enum(['push', 'email', 'sms', 'in_app']).default('push'),

  // Maps & Location
  GOOGLE_MAPS_API_KEY: z.string().default(''),
  MAPBOX_ACCESS_TOKEN: z.string().default(''),
  DEFAULT_SEARCH_RADIUS_KM: z.coerce.number().min(0.1).max(100).default(10),
  DRIVER_AVERAGE_SPEED_KMH: z.coerce.number().min(5).max(120).default(30),
  DELIVERY_BASE_FEE: z.coerce.number().min(0).default(5.0),
  DELIVERY_FEE_PER_KM: z.coerce.number().min(0).default(1.5),
});

function validateEnv(): z.infer<typeof envSchema> {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = validateEnv();

export type Config = z.infer<typeof envSchema>;
