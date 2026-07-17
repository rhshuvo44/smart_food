import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { ZoneManagementView } from '../../../components/maps/ZoneManagementView';

export default function DeliveryZonesScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Delivery Zones', headerShown: false }} />
      <ZoneManagementView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
});
