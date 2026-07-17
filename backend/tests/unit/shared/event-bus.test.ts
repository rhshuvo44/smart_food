import { EventBus } from '../../../src/shared/event-bus.js';

interface TestEvent {
  type: 'test.event';
  aggregateType: string;
  aggregateId: string;
  id: string;
  timestamp: Date;
  correlationId: string;
  data: { message: string };
}

function createTestEvent(overrides: Partial<TestEvent> = {}): TestEvent {
  return {
    type: 'test.event',
    aggregateType: 'test',
    aggregateId: '123',
    id: 'uuid-1',
    timestamp: new Date(),
    correlationId: 'corr-1',
    data: { message: 'hello' },
    ...overrides,
  };
}

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = EventBus.getInstance();
    eventBus.clear();
  });

  afterEach(() => {
    eventBus.clear();
  });

  it('is a singleton', () => {
    const instance1 = EventBus.getInstance();
    const instance2 = EventBus.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('publishes and delivers event to subscriber', (done) => {
    const event = createTestEvent();

    eventBus.subscribe('test.event', (received) => {
      expect(received).toEqual(event);
      done();
    });

    eventBus.publish(event);
  });

  it('supports multiple subscribers for the same event', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const event = createTestEvent();

    eventBus.subscribe('test.event', handler1);
    eventBus.subscribe('test.event', handler2);

    eventBus.publish(event);

    expect(handler1).toHaveBeenCalledWith(event);
    expect(handler2).toHaveBeenCalledWith(event);
  });

  it('does not deliver to unsubscribed handlers', () => {
    const handler = jest.fn();
    const event = createTestEvent();

    eventBus.subscribe('test.event', handler);
    eventBus.unsubscribe('test.event', handler);
    eventBus.publish(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('subscribeAll registers multiple handlers', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const event = createTestEvent();

    eventBus.subscribeAll([
      { eventType: 'test.event', handler: handler1 },
      { eventType: 'test.event', handler: handler2 },
    ]);

    eventBus.publish(event);

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it('tracks listener count', () => {
    const handler = jest.fn();

    expect(eventBus.listenerCount('test.event')).toBe(0);

    eventBus.subscribe('test.event', handler);
    expect(eventBus.listenerCount('test.event')).toBe(1);
  });

  it('handles async handlers', (done) => {
    const event = createTestEvent();

    eventBus.subscribe('test.event', async (received) => {
      await Promise.resolve();
      expect(received).toEqual(event);
      done();
    });

    eventBus.publish(event);
  });
});
