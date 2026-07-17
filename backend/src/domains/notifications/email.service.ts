import sgMail from '@sendgrid/mail';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { templateService } from './template.service.js';

// In-memory rate limiter: Map<email, timestamp[]>
const emailRateMap = new Map<string, number[]>();
const EMAIL_RATE_LIMIT = 50; // max 50 email/hour per user
const EMAIL_RATE_WINDOW = 3_600_000; // 1 hour in ms

let isInitialized = false;

function initialize(): void {
  if (isInitialized) return;
  if (env.SENDGRID_API_KEY) {
    sgMail.setApiKey(env.SENDGRID_API_KEY);
    isInitialized = true;
    logger.info('SendGrid initialized');
  } else {
    logger.warn('SENDGRID_API_KEY not set — email sending will be mocked');
    isInitialized = true;
  }
}

function checkEmailRateLimit(email: string): boolean {
  const now = Date.now();
  const timestamps = emailRateMap.get(email) || [];

  // Filter out timestamps outside the window
  const recent = timestamps.filter((ts) => now - ts < EMAIL_RATE_WINDOW);

  if (recent.length >= EMAIL_RATE_LIMIT) {
    return false;
  }

  recent.push(now);
  emailRateMap.set(email, recent);
  return true;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a plain email via SendGrid.
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  html?: string,
): Promise<EmailResult> {
  initialize();

  if (!checkEmailRateLimit(to)) {
    logger.warn({ email: to }, 'Email rate limit exceeded');
    return { success: false, error: 'Rate limit exceeded' };
  }

  if (!env.SENDGRID_API_KEY || env.SENDGRID_API_KEY === '') {
    // Mock mode for development/testing
    logger.info({ to, subject }, '[Mock] Email sent (no SendGrid API key configured)');
    return { success: true, messageId: `mock_${Date.now()}` };
  }

  try {
    const msg = {
      to,
      from: env.SENDGRID_FROM_EMAIL,
      subject,
      text: body,
      ...(html ? { html } : {}),
    };

    const [response] = await sgMail.send(msg);
    const messageId = response.headers?.['x-message-id'] || `sg_${Date.now()}`;

    logger.info({ email: to, messageId, subject }, 'Email sent successfully');
    return { success: true, messageId: messageId as string };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error: errorMessage, email: to }, 'Failed to send email');
    return { success: false, error: errorMessage };
  }
}

/**
 * Send an email using a notification template.
 */
export async function sendEmailWithTemplate(
  to: string,
  templateKey: string,
  data: Record<string, unknown>,
  locale = 'en',
): Promise<EmailResult> {
  try {
    const template = await templateService.getTemplate(templateKey, 'email', locale);
    if (!template) {
      logger.warn({ templateKey, locale }, 'Email template not found, falling back to in-app');
      return { success: false, error: 'Template not found' };
    }

    const rendered = templateService.renderTemplate(template, data);
    return sendEmail(to, rendered.title, rendered.body);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error: errorMessage, templateKey }, 'Failed to send templated email');
    return { success: false, error: errorMessage };
  }
}

/**
 * Reset rate limiter (useful for testing).
 */
export function resetEmailRateLimiter(): void {
  emailRateMap.clear();
}

export function resetEmailClient(): void {
  isInitialized = false;
}
