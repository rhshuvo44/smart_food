import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      idempotencyKey?: string;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export function correlationMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
  next();
}
