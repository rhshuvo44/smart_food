import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { DeliveryZoneMap } from '../../../components/maps/DeliveryZoneMap';

export default function DeliveryZonesScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Delivery Zones', headerShown: true }} />
      <DeliveryZoneMap />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
});
