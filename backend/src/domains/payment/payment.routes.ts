import { Router } from 'express';
import {
  createIntent,
  confirm,
  refund,
  getByOrder,
  initSslcommerz,
  sslcommerzSuccess,
  sslcommerzFail,
  sslcommerzCancel,
  sslcommerzIPN,
} from './payment.controller.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';
import { idempotencyMiddleware } from '../../shared/idempotency.js';
import { UserRole } from '@smartfood/shared';

const router = Router();

router.post('/payments/create-intent', authMiddleware, idempotencyMiddleware, asyncHandler(createIntent));
router.post('/payments/:id/confirm', authMiddleware, idempotencyMiddleware, asyncHandler(confirm));
router.post(
  '/payments/:id/refund',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.RESTAURANT_OWNER),
  idempotencyMiddleware,
  asyncHandler(refund),
);
router.get('/payments/order/:orderId', authMiddleware, asyncHandler(getByOrder));

router.post('/payments/sslcommerz/init', authMiddleware, idempotencyMiddleware, asyncHandler(initSslcommerz));
router.post('/payments/sslcommerz/success', asyncHandler(sslcommerzSuccess));
router.post('/payments/sslcommerz/fail', asyncHandler(sslcommerzFail));
router.post('/payments/sslcommerz/cancel', asyncHandler(sslcommerzCancel));
router.post('/payments/sslcommerz/ipn', asyncHandler(sslcommerzIPN));

export { router as paymentRoutes };
