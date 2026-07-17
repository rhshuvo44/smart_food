import { useEffect, useCallback } from 'react';
import { View, FlatList, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useChatStore } from '../../stores/chat.store';
import { ConversationItem } from '../../components/chat/ConversationItem';
import { LoadingScreen } from '../../components/common/loading-screen';
import { EmptyState } from '../../components/common/empty-state';

export default function ConversationsScreen() {
  const router = useRouter();
  const { conversations, isLoading, error, fetchConversations } = useChatStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handlePress = useCallback(
    (id: string) => {
      router.push(`/chat/${id}`);
    },
    [router],
  );

  if (isLoading) return <LoadingScreen message="Loading conversations..." />;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Stack.Screen options={{ title: 'Chat', headerShown: true }} />
      {error ? (
        <View style={{ padding: 32 }}>
          <Text style={{ color: '#DC3545', textAlign: 'center' }}>{error}</Text>
        </View>
      ) : conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          subtitle="Restaurant support conversations will appear here."
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ConversationItem conversation={item} onPress={handlePress} />}
        />
      )}
    </View>
  );
}
