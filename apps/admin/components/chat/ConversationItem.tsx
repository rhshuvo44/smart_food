import { TouchableOpacity, View, Text } from 'react-native';
import type { IConversation } from '@smartfood/shared';

interface ConversationItemProps {
  conversation: IConversation;
  onPress: (id: string) => void;
}

function getTitle(conversation: IConversation): string {
  if (conversation.type === 'order') {
    return `Order #${conversation.orderId?.slice(-6) || 'Unknown'}`;
  }
  return `Restaurant Support${conversation.restaurantId ? ` #${String(conversation.restaurantId).slice(-6)}` : ''}`;
}

function getLastMessage(conversation: IConversation): string {
  if (!conversation.lastMessage) return 'No messages yet';
  const text = conversation.lastMessage.content;
  return text.length > 60 ? text.slice(0, 60) + '...' : text;
}

export function ConversationItem({ conversation, onPress }: ConversationItemProps) {
  const unread = (conversation as any).unreadCount || 0;

  return (
    <TouchableOpacity
      onPress={() => onPress(conversation.id)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F3F5',
        backgroundColor: unread > 0 ? '#F8F9FA' : '#FFFFFF',
      }}
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: conversation.type === 'order' ? '#004E89' : '#FF6B35',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 18, color: '#FFFFFF' }}>
          {conversation.type === 'order' ? '🛵' : '🏪'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1A2E' }}>
            {getTitle(conversation)}
          </Text>
          {unread > 0 && (
            <View
              style={{
                backgroundColor: '#1A1A2E',
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 6,
              }}
            >
              <Text style={{ fontSize: 11, color: '#FFFFFF', fontWeight: '700' }}>{unread}</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 14, color: '#6C757D', marginTop: 2 }}>
          {getLastMessage(conversation)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
