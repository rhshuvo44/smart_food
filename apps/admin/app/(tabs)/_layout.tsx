import { Text } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../constants';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>;
}

export default function TabLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/(auth)/login');
  }, [isAuthenticated]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border, borderTopWidth: 1, paddingBottom: 8, paddingTop: 8, height: 60 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} /> }} />
      <Tabs.Screen name="restaurants" options={{ title: 'Restaurants', tabBarIcon: ({ focused }) => <TabIcon icon="🏪" focused={focused} /> }} />
      <Tabs.Screen name="users" options={{ title: 'Users', tabBarIcon: ({ focused }) => <TabIcon icon="👥" focused={focused} /> }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics', tabBarIcon: ({ focused }) => <TabIcon icon="📈" focused={focused} /> }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports', tabBarIcon: ({ focused }) => <TabIcon icon="📄" focused={focused} /> }} />
      <Tabs.Screen name="delivery-zones/index" options={{ title: 'Zones', tabBarIcon: ({ focused }) => <TabIcon icon="📍" focused={focused} /> }} />
    </Tabs>
  );
}
