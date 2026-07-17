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
      }}
    >
      <Text style={{ fontSize: 64, marginBottom: 16 }}>404</Text>
      <Button title="Go Home" onPress={() => router.replace('/(tabs)')} variant="secondary" />
    </View>
  );
}
