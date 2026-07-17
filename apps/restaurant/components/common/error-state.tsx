import { View, Text, TouchableOpacity } from 'react-native';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          color: '#1A1A2E',
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        Something went wrong
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: '#6C757D',
          textAlign: 'center',
          marginBottom: 24,
          lineHeight: 20,
        }}
      >
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={{
            backgroundColor: '#004E89',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
