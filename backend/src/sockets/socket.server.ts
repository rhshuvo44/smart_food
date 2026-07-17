import type { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { corsOptions } from '../config/cors.js';
import { registerChatSocketHandlers } from '../domains/chat/chat.socket-handler.js';

let io: SocketServer | null = null;

export function initializeSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: corsOptions.origin,
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token as string, env.JWT_ACCESS_SECRET) as {
        sub: string;
        role: string;
      };
      (socket as any).userId = decoded.sub;
      (socket as any).userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info('Client connected', { socketId: socket.id, userId: (socket as any).userId });

    // ─── Order Room Events ──────────────────────────────────────────────

    socket.on('join-order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      logger.info('Joined order room', { socketId: socket.id, orderId });
    });

    socket.on('leave-order', (orderId: string) => {
      socket.leave(`order:${orderId}`);
      logger.info('Left order room', { socketId: socket.id, orderId });
    });

    // ─── Restaurant Room Events ──────────────────────────────────────────

    socket.on('join-restaurant', (restaurantId: string) => {
      socket.join(`restaurant:${restaurantId}`);
      logger.info('Joined restaurant room', { socketId: socket.id, restaurantId });
    });

    socket.on('leave-restaurant', (restaurantId: string) => {
      socket.leave(`restaurant:${restaurantId}`);
    });

    // ─── Admin Room Events ──────────────────────────────────────────────

    socket.on('join-admin', (room: string) => {
      socket.join(`admin:${room}`);
      logger.info('Joined admin room', { socketId: socket.id, room });
    });

    socket.on('leave-admin', (room: string) => {
      socket.leave(`admin:${room}`);
    });

    // ─── Driver Location Sharing ─────────────────────────────────────────

    socket.on('driver:location-update', (data: { orderId: string; lat: number; lng: number }) => {
      // Broadcast to the order room
      io?.to(`order:${data.orderId}`).emit('delivery.location_updated', {
        orderId: data.orderId,
        location: { lat: data.lat, lng: data.lng },
        timestamp: new Date().toISOString(),
      });
    });

    // ─── Chat Events ────────────────────────────────────────────────────
    registerChatSocketHandlers(io!, socket);

    socket.on('disconnect', () => {
      logger.info('Client disconnected', { socketId: socket.id });
    });
  });

  logger.info('Socket.IO server initialized with delivery event handlers');
  return io;
}

export function getIO(): SocketServer | null {
  return io;
}
