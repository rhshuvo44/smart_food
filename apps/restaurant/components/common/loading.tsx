import { View, ActivityIndicator, Text } from 'react-native';
interface LoadingProps {
  message?: string;
}
export function Loading({ message }: LoadingProps) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#004E89" />
      {message && <Text style={{ marginTop: 12, fontSize: 16, color: '#6C757D' }}>{message}</Text>}
    </View>
  );
}
