import type { Request, Response, NextFunction } from 'express';
import mongoose, { type Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

interface IIdempotencyKey {
  key: string;
  response: unknown;
  createdAt: Date;
}

const idempotencySchema = new mongoose.Schema<IIdempotencyKey>(
  {
    key: { type: String, required: true, unique: true },
    response: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'idempotency_keys' },
);

idempotencySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

let IdempotencyModel: Model<IIdempotencyKey> | null = null;

function getModel(): Model<IIdempotencyKey> {
  if (!IdempotencyModel) {
    try {
      IdempotencyModel = mongoose.model<IIdempotencyKey>('IdempotencyKey');
    } catch {
      IdempotencyModel = mongoose.model<IIdempotencyKey>('IdempotencyKey', idempotencySchema);
    }
  }
  return IdempotencyModel;
}

export async function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    next();
    return;
  }

  const key = (req.headers['idempotency-key'] as string) || uuidv4();
  req.idempotencyKey = key;

  try {
    const Model = getModel();
    const existing = await Model.findOne({ key });

    if (existing) {
      res.status(200).json(existing.response);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
      Model.create({ key, response: body }).catch(() => {});
      return originalJson(body);
    };

    next();
  } catch {
    next();
  }
}
