import { useLocalSearchParams, Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useDeliveryTracking } from '../../hooks/useDeliveryTracking';
import { LiveTrackingView } from '../../components/maps/LiveTrackingView';
import { Loading } from '../../components/common/loading';
import { ErrorState } from '../../components/common/error-state';

export default function OrderTrackingScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { tracking, isLoading, error } = useDeliveryTracking(orderId);

  if (isLoading) return <Loading message="Loading tracking..." />;
  if (error || !tracking) return <ErrorState message={error || 'Tracking not found'} />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Order #${orderId?.slice(-6)}`, headerShown: true }} />
      <LiveTrackingView tracking={tracking} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
});
