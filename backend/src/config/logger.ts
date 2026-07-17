import pino from 'pino';
import path from 'path';
import { env } from './env.js';

const logDir = path.resolve(process.cwd(), 'logs');

const devTransport =
  env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
    : undefined;

const pinoLogger = pino({
  level: env.LOG_LEVEL,
  transport: devTransport,
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      correlationId: req.correlationId,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
});

const fileLogger =
  env.NODE_ENV !== 'test'
    ? pino(
        pino.transport({
          targets: [
            {
              level: 'error',
              target: 'pino/file',
              options: { destination: path.join(logDir, 'error.log'), mkdir: true },
            },
            {
              level: env.LOG_LEVEL,
              target: 'pino/file',
              options: { destination: path.join(logDir, 'combined.log'), mkdir: true },
            },
          ],
        }),
      )
    : pino({ level: 'silent' });

type LogMeta = Record<string, unknown>;

class Logger {
  private log(level: 'info' | 'warn' | 'error' | 'debug', first: unknown, second?: unknown): void {
    let msg: string;
    let meta: LogMeta | undefined;

    if (typeof first === 'string') {
      msg = first;
      if (second instanceof Error) {
        meta = { err: second };
      } else if (second && typeof second === 'object') {
        meta = second as LogMeta;
      }
    } else if (first && typeof first === 'object') {
      meta = first as LogMeta;
      msg = typeof second === 'string' ? second : '';
    } else {
      msg = String(first);
    }

    if (meta) {
      pinoLogger[level](meta, msg);
      fileLogger[level](meta, msg);
    } else {
      pinoLogger[level](msg);
      fileLogger[level](msg);
    }
  }

  info(first: unknown, second?: unknown): void {
    this.log('info', first, second);
  }

  warn(first: unknown, second?: unknown): void {
    this.log('warn', first, second);
  }

  error(first: unknown, second?: unknown): void {
    this.log('error', first, second);
  }

  debug(first: unknown, second?: unknown): void {
    this.log('debug', first, second);
  }
}

export const logger = new Logger();

export function childLogger(bindings: Record<string, unknown>) {
  return pinoLogger.child(bindings);
}

export class LoggerStream {
  write(message: string): void {
    pinoLogger.info(message.trim());
  }
}

export default logger;
