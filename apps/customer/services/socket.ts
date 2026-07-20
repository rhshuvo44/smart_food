import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private maxReconnectAttempts = 10;

  async connect() {
    if (this.socket?.connected) return;

    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) return;

    this.socket = io(BASE_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    });

    this.socket.on('connect', () => {});

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

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event: string, callback: (data: any) => void) {
    this.listeners.get(event)?.delete(callback);
  }
}

export const socketService = new SocketService();
export default socketService;
