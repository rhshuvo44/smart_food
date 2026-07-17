import { View, Text } from 'react-native';
import { Button } from '../components/common/button';
import { router } from 'expo-router';

export default function UnmatchedScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 24,
      }}
    >
      <Text style={{ fontSize: 64, marginBottom: 16 }}>404</Text>
      <Text style={{ fontSize: 20, fontWeight: '600', color: '#1A1A2E', marginBottom: 8 }}>
        Page Not Found
      </Text>
      <Text style={{ fontSize: 16, color: '#6C757D', marginBottom: 24, textAlign: 'center' }}>
        The page you're looking for doesn't exist.
      </Text>
      <Button title="Go Home" onPress={() => router.replace('/(tabs)')} variant="primary" />
    </View>
  );
}
