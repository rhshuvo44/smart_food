import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms [${req.correlationId}]`,
    );
  });

  next();
}
