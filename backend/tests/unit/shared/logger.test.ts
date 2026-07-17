import { logger, childLogger } from '../../../src/config/logger.js';

describe('Logger', () => {
  it('exports a logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
  });

  it('creates a child logger with bindings', () => {
    const child = childLogger({ module: 'test' });
    expect(child).toBeDefined();
    expect(typeof child.info).toBe('function');
  });

  it('logs at different levels without throwing', () => {
    expect(() => {
      logger.info('test info message');
      logger.error('test error message');
      logger.warn('test warn message');
      logger.debug('test debug message');
    }).not.toThrow();
  });

  it('child logger logs without throwing', () => {
    const child = childLogger({ requestId: '123' });
    expect(() => {
      child.info('child log message');
    }).not.toThrow();
  });
});
