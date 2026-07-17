import { EventEmitter } from 'events';
import type { IDomainEvent } from '@smartfood/shared';
import { logger } from '../config/logger.js';

type EventHandler<T extends IDomainEvent> = (event: T) => void | Promise<void>;

interface DeadLetterEntry {
  event: IDomainEvent;
  error: string;
  failedAt: Date;
  attempts: number;
}

const MAX_RETRIES = 3;
const MAX_DEAD_LETTER = 1000;

export class EventBus {
  private emitter: EventEmitter;
  private static instance: EventBus;
  private deadLetterQueue: DeadLetterEntry[] = [];
  private wrappers = new Map<string, Map<EventHandler<IDomainEvent>, EventHandler<IDomainEvent>>>();

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
    this.emitter.on('error', (err) => {
      logger.error({ err }, 'EventBus unhandled error');
    });
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  publish<T extends IDomainEvent>(event: T): void {
    logger.info({ eventType: event.type, aggregateId: event.aggregateId }, 'Event published');
    this.emitter.emit(event.type, event);
  }

  subscribe<T extends IDomainEvent>(eventType: T['type'], handler: EventHandler<T>): () => void {
    const wrappedHandler = async (event: T) => {
      let lastError: unknown;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          await handler(event);
          return;
        } catch (error) {
          lastError = error;
          logger.warn(
            { eventType, aggregateId: event.aggregateId, attempt, maxRetries: MAX_RETRIES },
            `Event handler failed (attempt ${attempt}/${MAX_RETRIES})`,
          );
          if (attempt < MAX_RETRIES) {
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
          }
        }
      }
      this.addToDeadLetter(
        event,
        lastError instanceof Error ? lastError.message : String(lastError),
        MAX_RETRIES,
      );
    };

    if (!this.wrappers.has(eventType)) {
      this.wrappers.set(eventType, new Map());
    }
    this.wrappers
      .get(eventType)!
      .set(handler as EventHandler<IDomainEvent>, wrappedHandler as EventHandler<IDomainEvent>);
    this.emitter.on(eventType, wrappedHandler);

    return () => {
      this.emitter.off(eventType, wrappedHandler);
      this.wrappers.get(eventType)?.delete(handler as EventHandler<IDomainEvent>);
    };
  }

  subscribeAll<T extends IDomainEvent>(
    handlers: Array<{ eventType: T['type']; handler: EventHandler<T> }>,
  ): () => void {
    const unsubs = handlers.map(({ eventType, handler }) => this.subscribe(eventType, handler));
    return () => unsubs.forEach((fn) => fn());
  }

  unsubscribe<T extends IDomainEvent>(eventType: T['type'], handler: EventHandler<T>): void {
    const wrapped = this.wrappers.get(eventType)?.get(handler as EventHandler<IDomainEvent>);
    if (wrapped) {
      this.emitter.off(eventType, wrapped);
      this.wrappers.get(eventType)?.delete(handler as EventHandler<IDomainEvent>);
    }
  }

  private addToDeadLetter(event: IDomainEvent, error: string, attempts: number): void {
    if (this.deadLetterQueue.length >= MAX_DEAD_LETTER) {
      this.deadLetterQueue.shift();
    }
    this.deadLetterQueue.push({ event, error, failedAt: new Date(), attempts });
    logger.error(
      { eventType: event.type, aggregateId: event.aggregateId, error, attempts },
      'Event moved to dead-letter queue',
    );
  }

  getDeadLetterCount(): number {
    return this.deadLetterQueue.length;
  }

  getDeadLetterEntries(): readonly DeadLetterEntry[] {
    return this.deadLetterQueue;
  }

  retryDeadLetter(index: number): void {
    const entry = this.deadLetterQueue[index];
    if (entry) {
      this.deadLetterQueue.splice(index, 1);
      this.emitter.emit(entry.event.type, entry.event);
    }
  }

  clear(): void {
    this.emitter.removeAllListeners();
  }

  clearDeadLetter(): void {
    this.deadLetterQueue = [];
  }

  listenerCount(eventType: string): number {
    return this.emitter.listenerCount(eventType);
  }
}
