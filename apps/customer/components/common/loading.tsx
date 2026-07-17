import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export function Loading({ message, fullScreen }: LoadingProps) {
  return (
    <View
      style={[
        { justifyContent: 'center', alignItems: 'center', padding: 32 },
        fullScreen && { flex: 1, backgroundColor: '#FFFFFF' },
      ]}
    >
      <ActivityIndicator size="large" color="#FF6B35" />
      {message && <Text style={{ marginTop: 12, fontSize: 16, color: '#6C757D' }}>{message}</Text>}
    </View>
  );
}
