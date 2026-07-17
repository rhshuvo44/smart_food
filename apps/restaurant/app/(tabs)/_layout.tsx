import { Tabs } from 'expo-router';
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#004E89',
        tabBarInactiveTintColor: '#6C757D',
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#DEE2E6' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="menu" options={{ title: 'Menu' }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="order-detail" options={{ title: 'Order Detail', href: null }} />
      <Tabs.Screen name="delivery-zones" options={{ title: 'Zones' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
