import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text, Animated, ActivityIndicator } from 'react-native';
import { loadStoredTokens } from '../services/api';
import { fetchProfile } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FF6B35',
      }}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 64, marginBottom: 16 }}>🍕</Text>
        <Text
          style={{
            fontSize: 36,
            fontWeight: '800',
            color: '#FFFFFF',
            letterSpacing: 1,
          }}
        >
          SmartFood
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.85)',
            marginTop: 8,
            letterSpacing: 0.5,
          }}
        >
          Your favorite food, delivered fast.
        </Text>
        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginTop: 48 }} />
      </Animated.View>
    </View>
  );
}

export default function RootLayout() {
  const { isLoading } = useAuthStore();

  useEffect(() => {
    async function bootstrap() {
      try {
        await loadStoredTokens();
        await fetchProfile();
      } catch {
        useAuthStore.getState().clearAuth();
      } finally {
        useAuthStore.getState().setLoading(false);
      }
    }
    bootstrap();
  }, []);

  if (isLoading) {
    return (
      <>
        <SplashScreen />
        <StatusBar style="light" />
      </>
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
