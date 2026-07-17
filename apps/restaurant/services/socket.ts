import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '../utils/storage';

type SocketEvent = 'order:status-changed' | 'order:new' | 'notification:new';
type EventCallback = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  }

  async connect() {
    if (this.socket?.connected) return;

    const token = await getAccessToken();
    if (!token) return;

    this.socket = io(this.baseUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {});

    this.socket.on('connect_error', () => {});

    this.socket.onAny((event: string, data: any) => {
      const handlers = this.listeners.get(event);
      if (handlers) {
        handlers.forEach((cb) => cb(data));
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRestaurant(restaurantId: string) {
    this.socket?.emit('join-restaurant', restaurantId);
  }

  leaveRestaurant(restaurantId: string) {
    this.socket?.emit('leave-restaurant', restaurantId);
  }

  joinOrder(orderId: string) {
    this.socket?.emit('join-order', orderId);
  }

  leaveOrder(orderId: string) {
    this.socket?.emit('leave-order', orderId);
  }

  joinConversation(conversationId: string) {
    this.socket?.emit('chat:join', { conversationId });
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('chat:leave', { conversationId });
  }

  sendChatMessage(conversationId: string, content: string) {
    return new Promise<{ success: boolean; message?: any; error?: string }>((resolve) => {
      this.socket?.emit('chat:send-message', { conversationId, content }, (response: any) => {
        resolve(response);
      });
    });
  }

  sendTyping(conversationId: string, isTyping: boolean) {
    this.socket?.emit('chat:typing', { conversationId, isTyping });
  }

  markChatRead(conversationId: string) {
    this.socket?.emit('chat:mark-read', { conversationId });
  }

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event: string, callback: EventCallback) {
    this.listeners.get(event)?.delete(callback);
  }
}

const socketService = new SocketService();

export function useSocketOrderUpdates(
  restaurantId: string | undefined,
  onStatusChanged?: (orderId: string, newStatus: string) => void,
) {
  const callbackRef = useRef(onStatusChanged);
  callbackRef.current = onStatusChanged;

  useEffect(() => {
    if (!restaurantId) return;

    socketService.connect();
    socketService.joinRestaurant(restaurantId);

    const unsubscribe = socketService.on('order:status-changed', (data) => {
      if (data?.orderId && data?.status && callbackRef.current) {
        callbackRef.current(data.orderId, data.status);
      }
    });

    return () => {
      unsubscribe();
      socketService.leaveRestaurant(restaurantId);
    };
  }, [restaurantId]);

  useEffect(() => {
    return () => {
      socketService.disconnect();
    };
  }, []);
}

export default socketService;
