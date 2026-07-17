import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthError } from '../shared/errors.js';
import { env } from '../config/env.js';

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthError('Missing or invalid authorization header'));
  }

  const token = authHeader.substring(7);
  if (!token) {
    return next(new AuthError('Missing token'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      sub: string;
      role: string;
    };
    req.userId = decoded.sub;
    req.userRole = decoded.role;
    next();
  } catch {
    next(new AuthError('Invalid or expired token'));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(new AuthError('Insufficient permissions'));
    }
    next();
  };
}
