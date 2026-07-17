import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import Stripe from 'stripe';
import { LoggerStream } from './config/logger.js';
import { apiRoutes } from './routes/index.js';
import { errorHandler } from './middleware/error.js';
import { AppError } from './shared/errors.js';
import { env } from './config/env.js';
import { corsOptions } from './config/cors.js';
import { correlationMiddleware } from './middleware/correlation.middleware.js';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware.js';
import { handleStripeWebhook } from './domains/payment/payment.service.js';

/**
 * Creates and configures the Express application.
 */
export function createApp(): express.Application {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS
  app.use(cors(corsOptions));

  // Request logging (dev mode: concise colored output)
  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev', { stream: new LoggerStream() }));
  } else {
    app.use(morgan('combined', { stream: new LoggerStream() }));
  }

  // Correlation ID
  app.use(correlationMiddleware);

  // Stripe webhook requires raw body — must be before global JSON parser
  app.post(
    '/api/v1/payments/webhook',
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response) => {
      const sig = req.headers['stripe-signature'] as string;

      let event: Stripe.Event;
      try {
        event = Stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Webhook signature verification failed';
        res.status(400).json({ success: false, error: message });
        return;
      }

      await handleStripeWebhook(event);
      res.status(200).json({ received: true });
    },
  );

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Baseline rate limiting for all API routes
  app.use('/api/', rateLimitMiddleware({ windowMs: 60 * 1000, maxRequests: 200 }));

  // API Routes
  app.use('/api/v1', apiRoutes);

  // 404 handler for unknown routes
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(AppError.notFound('The requested resource was not found'));
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}

export default createApp;
