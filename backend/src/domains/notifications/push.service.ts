import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';
import { logger } from '../../config/logger.js';

// In-memory rate limiter: Map<deviceToken, timestamp[]>
const pushRateMap = new Map<string, number[]>();
const PUSH_RATE_LIMIT = 5; // max 5 push/min per device
const PUSH_RATE_WINDOW = 60_000; // 1 minute in ms

let expo: Expo | null = null;

function getExpoClient(): Expo {
  if (!expo) {
    expo = new Expo();
  }
  return expo;
}

/**
 * Check rate limit for a device token.
 * Returns true if the push is allowed, false if rate limited.
 */
function checkPushRateLimit(token: string): boolean {
  const now = Date.now();
  const timestamps = pushRateMap.get(token) || [];

  // Filter out timestamps outside the window
  const recent = timestamps.filter((ts) => now - ts < PUSH_RATE_WINDOW);

  if (recent.length >= PUSH_RATE_LIMIT) {
    return false;
  }

  recent.push(now);
  pushRateMap.set(token, recent);
  return true;
}

/**
 * Validate if a token is a valid Expo push token.
 */
function isValidExpoPushToken(token: string): boolean {
  return Expo.isExpoPushToken(token);
}

export interface PushResult {
  success: boolean;
  ticketId?: string;
  error?: string;
}

/**
 * Send a single push notification via Expo.
 */
export async function sendPush(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<PushResult> {
  if (!isValidExpoPushToken(token)) {
    logger.warn({ token }, 'Invalid Expo push token');
    return { success: false, error: 'Invalid Expo push token' };
  }

  if (!checkPushRateLimit(token)) {
    logger.warn({ token }, 'Push rate limit exceeded for device');
    return { success: false, error: 'Rate limit exceeded' };
  }

  try {
    const client = getExpoClient();
    const message: ExpoPushMessage = {
      to: token,
      sound: 'default',
      title,
      body,
      data: data || {},
      priority: 'high',
    };

    const tickets: ExpoPushTicket[] = await client.sendPushNotificationsAsync([message]);
    const ticket = tickets[0];

    if (ticket.status === 'error') {
      const errorMessage = ticket.message || 'Unknown push error';
      logger.error({ token, error: ticket }, 'Push notification failed');
      return { success: false, error: errorMessage };
    }

    logger.info({ token, ticketId: ticket.id }, 'Push notification sent successfully');
    return { success: true, ticketId: ticket.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error: errorMessage, token }, 'Push notification threw exception');
    return { success: false, error: errorMessage };
  }
}

/**
 * Send push notifications to multiple devices.
 */
export async function sendPushToMultiple(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<PushResult[]> {
  const results: PushResult[] = [];

  // Validate and rate limit tokens
  const validTokens: string[] = [];
  for (const token of tokens) {
    if (!isValidExpoPushToken(token)) {
      results.push({ success: false, error: 'Invalid Expo push token' });
      continue;
    }
    if (!checkPushRateLimit(token)) {
      results.push({ success: false, error: 'Rate limit exceeded' });
      continue;
    }
    validTokens.push(token);
  }

  if (validTokens.length === 0) {
    return results;
  }

  try {
    const client = getExpoClient();
    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: data || {},
      priority: 'high',
    }));

    const tickets = await client.sendPushNotificationsAsync(messages);

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (ticket.status === 'error') {
        const errorMessage = ticket.message || 'Unknown push error';
        logger.error({ token: validTokens[i], error: ticket }, 'Push notification failed');
        results.push({ success: false, error: errorMessage });
      } else {
        results.push({ success: true, ticketId: ticket.id });
      }
    }

    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error: errorMessage }, 'Batch push notification threw exception');
    return validTokens.map(() => ({ success: false, error: errorMessage }));
  }
}

/**
 * Check push receipt statuses after sending.
 * This should be called periodically (e.g., via a cron job).
 */
export async function checkPushReceipts(ticketIds: string[]): Promise<void> {
  if (ticketIds.length === 0) return;

  try {
    const client = getExpoClient();
    const receipts = await client.getPushNotificationReceiptsAsync(ticketIds);

    for (const [ticketId, receipt] of Object.entries(receipts)) {
      if (receipt.status === 'error') {
        logger.error(
          { ticketId, error: receipt.details, message: receipt.message },
          'Push receipt indicates delivery failure',
        );

        // If the device is no longer registered, we could mark the token as invalid
        if (receipt.details?.error === 'DeviceNotRegistered') {
          logger.warn({ ticketId }, 'Device not registered — token should be removed');
        }
      } else {
        logger.info({ ticketId }, 'Push notification delivered successfully');
      }
    }
  } catch (error) {
    logger.error({ error }, 'Failed to check push receipts');
  }
}

/**
 * Reset rate limiter (useful for testing).
 */
export function resetPushRateLimiter(): void {
  pushRateMap.clear();
}
