import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { RestaurantMapView } from '../../components/maps/RestaurantMapView';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <RestaurantMapView onRestaurantPress={(id) => console.log('Restaurant pressed:', id)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
});
