import { View, Text } from 'react-native';
import { Button } from './button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <View style={{ justifyContent: 'center', alignItems: 'center', padding: 32 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠</Text>
      <Text style={{ fontSize: 16, color: '#6C757D', textAlign: 'center', marginBottom: 16 }}>
        {message}
      </Text>
      {onRetry && <Button title="Try Again" onPress={onRetry} variant="primary" />}
    </View>
  );
}
