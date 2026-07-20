import { create } from 'zustand';
import type { IConversation, IMessage } from '@smartfood/shared';
import api from '../services/api';

interface ChatState {
  conversations: IConversation[];
  currentConversationId: string | null;
  messages: Record<string, IMessage[]>;
  unreadCounts: Record<string, number>;
  isLoading: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  typingUsers: Record<string, { userId: string; userRole: string }[]>;

  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string, page?: number) => Promise<void>;
  addMessage: (conversationId: string, message: IMessage) => void;
  setCurrentConversation: (id: string | null) => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
  setTyping: (conversationId: string, userId: string, userRole: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversationId: null,
  messages: {},
  unreadCounts: {},
  isLoading: false,
  isLoadingMessages: false,
  error: null,
  typingUsers: {},

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/conversations');
      const convs: IConversation[] = data.data.conversations;
      const unreadCounts: Record<string, number> = {};
      convs.forEach((c: any) => { unreadCounts[c.id] = c.unreadCount || 0; });
      set({ conversations: convs, unreadCounts, isLoading: false });
    } catch {
      set({ error: 'Failed to load conversations', isLoading: false });
    }
  },

  fetchMessages: async (conversationId, page = 1) => {
    set({ isLoadingMessages: true });
    try {
      const { data } = await api.get(`/conversations/${conversationId}/messages?page=${page}&limit=50`);
      const msgs: IMessage[] = data.data.messages;
      set((state) => {
        const existing = state.messages[conversationId] || [];
        const combined = page === 1 ? msgs : [...existing, ...msgs];
        return {
          messages: {
            ...state.messages,
            [conversationId]: combined.slice(0, 200),
          },
          isLoadingMessages: false,
        };
      });
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  addMessage: (conversationId, message) => {
    set((state) => {
      const existing = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: [message, ...existing].slice(0, 200),
        },
        conversations: state.conversations.map((c) =>
          c.id === conversationId
            ? { ...c, lastMessage: { content: message.content, senderId: message.senderId, senderRole: message.senderRole, timestamp: message.createdAt } }
            : c,
        ),
      };
    });
  },

  setCurrentConversation: (id) => set({ currentConversationId: id }),

  incrementUnread: (conversationId) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: (state.unreadCounts[conversationId] || 0) + 1,
      },
    }));
  },

  clearUnread: (conversationId) => {
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [conversationId]: 0 },
    }));
  },

  setTyping: (conversationId, userId, userRole, isTyping) => {
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      if (isTyping) {
        if (current.some((u) => u.userId === userId)) return state;
        return { typingUsers: { ...state.typingUsers, [conversationId]: [...current, { userId, userRole }] } };
      }
      return { typingUsers: { ...state.typingUsers, [conversationId]: current.filter((u) => u.userId !== userId) } };
    });
  },
}));
