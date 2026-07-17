import { templateService } from '../template.service.js';
import { logger } from '../../../config/logger.js';

/**
 * Seed notification templates into the database.
 * Can be called from the main seed script or server startup.
 */
export async function seedNotificationTemplates(): Promise<void> {
  logger.info('Seeding notification templates...');
  await templateService.seedTemplates();
  logger.info('Notification templates seeding complete');
}
