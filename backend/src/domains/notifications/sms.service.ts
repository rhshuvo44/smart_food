import twilio from 'twilio';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

// In-memory rate limiter: Map<phone, timestamp[]>
const smsRateMap = new Map<string, number[]>();
const SMS_RATE_LIMIT = 10; // max 10 SMS/hour per user
const SMS_RATE_WINDOW = 3_600_000; // 1 hour in ms

let twilioClient: twilio.Twilio | null = null;

function getClient(): twilio.Twilio | null {
  if (twilioClient) return twilioClient;

  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    logger.info('Twilio client initialized');
    return twilioClient;
  }

  logger.warn('Twilio credentials not set — SMS sending will be mocked');
  return null;
}

function checkSmsRateLimit(phone: string): boolean {
  const now = Date.now();
  const timestamps = smsRateMap.get(phone) || [];

  // Filter out timestamps outside the window
  const recent = timestamps.filter((ts) => now - ts < SMS_RATE_WINDOW);

  if (recent.length >= SMS_RATE_LIMIT) {
    return false;
  }

  recent.push(now);
  smsRateMap.set(phone, recent);
  return true;
}

export interface SmsResult {
  success: boolean;
  sid?: string;
  error?: string;
}

/**
 * Send a single SMS via Twilio.
 */
export async function sendSMS(to: string, body: string): Promise<SmsResult> {
  if (!checkSmsRateLimit(to)) {
    logger.warn({ phone: to }, 'SMS rate limit exceeded');
    return { success: false, error: 'Rate limit exceeded' };
  }

  const client = getClient();

  if (!client) {
    // Mock mode for development/testing
    logger.info({ to }, '[Mock] SMS sent (no Twilio credentials configured)');
    return { success: true, sid: `mock_${Date.now()}` };
  }

  if (!env.TWILIO_FROM_NUMBER) {
    logger.error('TWILIO_FROM_NUMBER not configured');
    return { success: false, error: 'TWILIO_FROM_NUMBER not configured' };
  }

  try {
    const message = await client.messages.create({
      to,
      from: env.TWILIO_FROM_NUMBER,
      body,
    });

    logger.info({ to, sid: message.sid, status: message.status }, 'SMS sent successfully');
    return { success: true, sid: message.sid };
  } catch (error: unknown) {
    const twilioError = error as { code?: number; message?: string };
    const errorCode = twilioError.code || 0;
    const errorMessage = twilioError.message || 'Unknown error';

    logger.error({ error: errorMessage, code: errorCode, to }, 'Failed to send SMS');

    // Map Twilio error codes
    if (errorCode === 21211) {
      return { success: false, error: 'Invalid phone number' };
    }
    if (errorCode === 21608) {
      return { success: false, error: 'Phone number not verified for trial account' };
    }
    if (errorCode === 21610) {
      return { success: false, error: 'Phone number is opted out' };
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Reset rate limiter (useful for testing).
 */
export function resetSmsRateLimiter(): void {
  smsRateMap.clear();
}

export function resetTwilioClient(): void {
  twilioClient = null;
}
