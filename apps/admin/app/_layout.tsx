import { UIManager, Platform, View, ActivityIndicator } from 'react-native';
if (Platform.OS === 'web' && UIManager && typeof UIManager.hasViewManagerConfig !== 'function') {
  (UIManager as any).hasViewManagerConfig = () => false;
}

import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { loadStoredTokens } from '../services/api';
import { fetchProfile } from '../services/auth.service';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 5 * 60 * 1000 } },
});

export default function RootLayout() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    async function bootstrap() {
      await loadStoredTokens();
      try {
        await fetchProfile();
      } catch {
        useAuthStore.getState().clearAuth();
      }
    }
    bootstrap();
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
        }}
      >
        <ActivityIndicator size="large" color="#1A1A2E" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </View>
    </QueryClientProvider>
  );
}
