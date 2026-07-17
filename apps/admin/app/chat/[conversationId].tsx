import { useEffect, useRef, useCallback } from 'react';
import { View, FlatList, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useChatStore } from '../../stores/chat.store';
import { ChatBubble } from '../../components/chat/ChatBubble';
import { ChatInput } from '../../components/chat/ChatInput';
import { LoadingScreen } from '../../components/common/loading-screen';
import socketService from '../../services/socket';
import { useAuthStore } from '../../stores/auth.store';

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    messages,
    isLoadingMessages,
    fetchMessages,
    addMessage,
    clearUnread,
    setTyping,
    typingUsers,
    conversations,
  } = useChatStore();
  const user = useAuthStore((s) => s.user);
  const conversation = conversations.find((c) => c.id === conversationId);
  const msgs = messages[conversationId!] || [];
  const typing = typingUsers[conversationId!] || [];

  useEffect(() => {
    if (!conversationId) return;
    fetchMessages(conversationId);
    clearUnread(conversationId);
    socketService.connect();
    socketService.joinConversation(conversationId);
    socketService.markChatRead(conversationId);

    const unsubNewMessage = socketService.on('chat:new-message', (data: any) => {
      if (data.conversationId === conversationId) {
        addMessage(conversationId, data.message);
      }
    });

    const unsubTyping = socketService.on('chat:user-typing', (data: any) => {
      if (data.conversationId === conversationId) {
        setTyping(conversationId, data.userId, data.userRole, data.isTyping);
      }
    });

    return () => {
      socketService.leaveConversation(conversationId);
      unsubNewMessage();
      unsubTyping();
    };
  }, [conversationId, fetchMessages, addMessage, clearUnread, setTyping]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!conversationId) return;
      const result = await socketService.sendChatMessage(conversationId, text);
      if (!result.success) {
        try {
          const api = await import('../../services/api').then((m) => m.default);
          await api.post(`/conversations/${conversationId}/messages`, { content: text });
        } catch {}
      }
    },
    [conversationId],
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!conversationId) return;
      socketService.sendTyping(conversationId, isTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          socketService.sendTyping(conversationId, false);
        }, 3000);
      }
    },
    [conversationId],
  );

  const title =
    conversation?.type === 'order'
      ? `Order #${conversation.orderId?.slice(-6) || 'Chat'}`
      : `Support${conversation?.restaurantId ? ` #${String(conversation.restaurantId).slice(-6)}` : ''}`;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ title, headerShown: true }} />
      {isLoadingMessages && msgs.length === 0 ? (
        <LoadingScreen message="Loading messages..." />
      ) : (
        <FlatList
          ref={flatListRef}
          data={msgs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble
              content={item.content}
              isOwn={item.senderId === user?.id}
              senderName={item.senderRole}
              timestamp={item.createdAt}
            />
          )}
          inverted
          contentContainerStyle={{ paddingVertical: 8 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToOffset({ offset: 0, animated: false })
          }
        />
      )}
      {typing.length > 0 && (
        <Text style={{ fontSize: 12, color: '#6C757D', paddingHorizontal: 16, paddingBottom: 4 }}>
          {typing.map((t) => t.userRole.replace('_', ' ')).join(', ')} typing...
        </Text>
      )}
      <ChatInput onSend={handleSend} onTyping={handleTyping} />
    </KeyboardAvoidingView>
  );
}
