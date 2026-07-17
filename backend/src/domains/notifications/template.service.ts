import {
  NotificationTemplate,
  type INotificationTemplateDocument,
} from './notification-template.model.js';
import type { NotificationChannel } from './notification.model.js';
import { logger } from '../../config/logger.js';

class TemplateService {
  /**
   * Get a template from the database by key, channel, and optional locale.
   */
  async getTemplate(
    key: string,
    channel: NotificationChannel,
    locale = 'en',
  ): Promise<INotificationTemplateDocument | null> {
    try {
      const template = await NotificationTemplate.findOne({
        key,
        channel,
        locale,
        isActive: true,
      }).sort({ version: -1 });

      if (!template) {
        // Try fallback to 'en' locale
        if (locale !== 'en') {
          logger.warn(
            { key, channel, locale },
            'Template not found for locale, falling back to en',
          );
          return this.getTemplate(key, channel, 'en');
        }
        logger.warn({ key, channel }, 'Template not found');
        return null;
      }

      return template;
    } catch (error) {
      logger.error({ error, key, channel }, 'Failed to fetch template');
      return null;
    }
  }

  /**
   * Render a template by replacing {{placeholders}} with actual values.
   */
  renderTemplate(
    template: INotificationTemplateDocument,
    data: Record<string, unknown>,
  ): { title: string; body: string } {
    const render = (text: string): string => {
      return text.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
        const value = data[key];
        if (value === undefined || value === null) {
          logger.warn({ key, templateKey: template.key }, 'Missing template variable');
          return `{{${key}}}`; // Leave unreplaced for visibility
        }
        return String(value);
      });
    };

    return {
      title: render(template.title),
      body: render(template.body),
    };
  }

  /**
   * Seed default notification templates into the database.
   * Skips existing templates (key + channel + locale combo).
   */
  async seedTemplates(): Promise<void> {
    const templates = [
      // ── Order Confirmation ──────────────────────────────────────
      {
        key: 'order_confirmation',
        channel: 'push' as NotificationChannel,
        title: 'Order Confirmed! 🎉',
        body: 'Hi {{firstName}}, your order #{{orderId}} of ${{total}} from {{restaurantName}} has been confirmed. Estimated delivery: {{estimatedTime}}.',
      },
      {
        key: 'order_confirmation',
        channel: 'email' as NotificationChannel,
        title: 'Order Confirmed — {{restaurantName}}',
        body: 'Dear {{firstName}},\n\nYour order has been confirmed!\n\nOrder ID: {{orderId}}\nRestaurant: {{restaurantName}}\nItems: {{itemCount}} items\nTotal: ${{total}}\nEstimated Delivery: {{estimatedTime}}\nDelivery Address: {{deliveryAddress}}\n\nThank you for choosing SmartFood!\n\n— SmartFood Team',
      },
      {
        key: 'order_confirmation',
        channel: 'sms' as NotificationChannel,
        title: 'Order Confirmed',
        body: 'Order confirmed! #{{orderId}} from {{restaurantName}} — ${{total}}. ETA: {{estimatedTime}}. - SmartFood',
      },
      {
        key: 'order_confirmation',
        channel: 'in_app' as NotificationChannel,
        title: 'Order Confirmed',
        body: 'Your order #{{orderId}} from {{restaurantName}} has been confirmed for ${{total}}.',
      },

      // ── Order Status Change ─────────────────────────────────────
      {
        key: 'order_status',
        channel: 'push' as NotificationChannel,
        title: 'Order Update',
        body: 'Your order #{{orderId}} is now {{newStatus}}.',
      },
      {
        key: 'order_status',
        channel: 'email' as NotificationChannel,
        title: 'Order Status Update — #{{orderId}}',
        body: 'Dear {{firstName}},\n\nYour order status has changed:\n\nOrder ID: {{orderId}}\nPrevious Status: {{previousStatus}}\nNew Status: {{newStatus}}\n\nTrack your order in the app for real-time updates.\n\n— SmartFood Team',
      },
      {
        key: 'order_status',
        channel: 'sms' as NotificationChannel,
        title: 'Order Update',
        body: 'Order #{{orderId}} update: {{previousStatus}} → {{newStatus}}. - SmartFood',
      },
      {
        key: 'order_status',
        channel: 'in_app' as NotificationChannel,
        title: 'Status Update',
        body: 'Your order #{{orderId}} changed from {{previousStatus}} to {{newStatus}}.',
      },

      // ── Order Cancelled ─────────────────────────────────────────
      {
        key: 'order_cancelled',
        channel: 'push' as NotificationChannel,
        title: 'Order Cancelled',
        body: 'Your order #{{orderId}} from {{restaurantName}} has been cancelled.',
      },
      {
        key: 'order_cancelled',
        channel: 'email' as NotificationChannel,
        title: 'Order Cancelled — #{{orderId}}',
        body: 'Dear {{firstName}},\n\nYour order #{{orderId}} from {{restaurantName}} has been cancelled.\n\nReason: {{reason}}\n\nIf you have any questions, please contact support.\n\n— SmartFood Team',
      },
      {
        key: 'order_cancelled',
        channel: 'sms' as NotificationChannel,
        title: 'Order Cancelled',
        body: 'Order #{{orderId}} from {{restaurantName}} cancelled. Reason: {{reason}}. - SmartFood',
      },
      {
        key: 'order_cancelled',
        channel: 'in_app' as NotificationChannel,
        title: 'Order Cancelled',
        body: 'Your order #{{orderId}} from {{restaurantName}} has been cancelled. Reason: {{reason}}.',
      },

      // ── Order Completed ─────────────────────────────────────────
      {
        key: 'order_completed',
        channel: 'push' as NotificationChannel,
        title: 'Order Delivered! 🎉',
        body: 'Your order from {{restaurantName}} has been delivered. Enjoy your meal!',
      },
      {
        key: 'order_completed',
        channel: 'email' as NotificationChannel,
        title: 'Order Delivered — {{restaurantName}}',
        body: 'Dear {{firstName}},\n\nGreat news! Your order from {{restaurantName}} has been delivered.\n\nOrder ID: {{orderId}}\nTotal Charged: ${{total}}\nDelivered At: {{deliveredAt}}\n\nWe hope you enjoy your meal! Please consider leaving a review.\n\n— SmartFood Team',
      },
      {
        key: 'order_completed',
        channel: 'sms' as NotificationChannel,
        title: 'Order Delivered',
        body: 'Your order from {{restaurantName}} has been delivered! Enjoy! - SmartFood',
      },
      {
        key: 'order_completed',
        channel: 'in_app' as NotificationChannel,
        title: 'Order Delivered',
        body: 'Your order from {{restaurantName}} has been delivered. Enjoy your meal!',
      },
    ];

    let createdCount = 0;
    for (const tmpl of templates) {
      try {
        const existing = await NotificationTemplate.findOne({
          key: tmpl.key,
          channel: tmpl.channel,
          locale: 'en',
        });

        if (!existing) {
          await NotificationTemplate.create({ ...tmpl, locale: 'en' });
          createdCount++;
        }
      } catch (error) {
        logger.error({ error, template: tmpl.key }, 'Failed to seed template');
      }
    }

    logger.info(`Seeded ${createdCount} notification templates`);
  }
}

export const templateService = new TemplateService();
