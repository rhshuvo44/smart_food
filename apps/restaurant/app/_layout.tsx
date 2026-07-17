import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View } from 'react-native';
import { useEffect } from 'react';
import { loadStoredTokens } from '../services/api';
import { fetchProfile } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';
import { Loading } from '../components/common/loading';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 5 * 60 * 1000 } },
});

export default function RootLayout() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    async function init() {
      try {
        const token = await loadStoredTokens();
        if (token) {
          const user = await fetchProfile();
          setAuth(user);
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <Loading message="Loading..." />
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
