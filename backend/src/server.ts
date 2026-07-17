import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './config/logger.js';
import { initializeSocketServer, getIO } from './sockets/socket.server.js';
import { registerPaymentSubscribers } from './domains/payment/payment.subscribers.js';

let server: http.Server;

/**
 * Gracefully shut down the server and close connections.
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  const io = getIO();
  if (io) {
    io.close();
    logger.info('Socket.IO server closed');
  }

  await disconnectDatabase();

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
}

/**
 * Start the Express server and connect to MongoDB.
 */
async function main(): Promise<void> {
  // Create Express app
  const app = createApp();
  server = http.createServer(app);

  // Initialize Socket.IO
  initializeSocketServer(server);

  // Connect to MongoDB (non-blocking - server starts even if DB unavailable)
  try {
    await connectDatabase();
    registerPaymentSubscribers();
  } catch (error) {
    logger.warn('MongoDB unavailable — server starting without database connection');
  }

  // Start listening
  server.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    logger.info(`Health check: http://localhost:${env.PORT}/api/v1/health`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error | unknown) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  if (reason instanceof Error) {
    console.error(reason);
  } else {
    console.error('Unhandled rejection:', reason);
  }
  logger.error('UNHANDLED REJECTION! Shutting down...');
  if (reason instanceof Error) {
    logger.error(reason.message, { err: reason });
  } else {
    logger.error('Unhandled rejection', { reason });
  }
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err);
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(err.message, { err });
  process.exit(1);
});

// Handle SIGTERM for graceful shutdown (e.g., from Docker/Kubernetes)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle SIGINT for graceful shutdown (e.g., from Ctrl+C)
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle SIGUSR2 for nodemon restarts
process.on('SIGUSR2', () => {
  gracefulShutdown('SIGUSR2');
});

main().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
