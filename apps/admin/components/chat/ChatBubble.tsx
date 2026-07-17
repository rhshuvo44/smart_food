import { View, Text } from 'react-native';

interface ChatBubbleProps {
  content: string;
  isOwn: boolean;
  senderName: string;
  timestamp: string;
}

export function ChatBubble({ content, isOwn, senderName, timestamp }: ChatBubbleProps) {
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View
      style={{
        alignItems: isOwn ? 'flex-end' : 'flex-start',
        marginVertical: 4,
        paddingHorizontal: 16,
      }}
    >
      <Text style={{ fontSize: 12, color: '#6C757D', marginBottom: 2 }}>{senderName}</Text>
      <View
        style={{
          maxWidth: '80%',
          backgroundColor: isOwn ? '#1A1A2E' : '#F1F3F5',
          borderRadius: 12,
          borderBottomRightRadius: isOwn ? 4 : 12,
          borderBottomLeftRadius: isOwn ? 12 : 4,
          paddingVertical: 8,
          paddingHorizontal: 12,
        }}
      >
        <Text style={{ fontSize: 15, color: isOwn ? '#FFFFFF' : '#1A1A2E' }}>{content}</Text>
      </View>
      <Text style={{ fontSize: 11, color: '#ADB5BD', marginTop: 2 }}>{time}</Text>
    </View>
  );
}
