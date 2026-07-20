import { useEffect, useRef } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text, Animated, ActivityIndicator } from 'react-native';
import { loadStoredTokens } from '../services/api';
import { fetchProfile } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';
import { getItem } from '../utils/storage';
import { colors } from '../constants';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 5 * 60 * 1000 },
  },
});

function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary }}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>🍕</Text>
        <Text style={{ fontSize: 36, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 }}>SmartFood</Text>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', marginTop: 8 }}>
          Your favorite food, delivered fast.
        </Text>
        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginTop: 48 }} />
      </Animated.View>
    </View>
  );
}

export default function RootLayout() {
  const { isLoading, isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const hasInitialized = useRef(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        await loadStoredTokens();
        await fetchProfile();
      } catch {
        useAuthStore.getState().clearAuth();
      } finally {
        useAuthStore.getState().setLoading(false);
        hasInitialized.current = true;
      }
    }
    bootstrap();
  }, []);

  useEffect(() => {
    if (isLoading || !hasInitialized.current) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuthGroup && !inOnboarding) {
      getItem('onboarding_seen').then((seen) => {
        if (seen !== 'true' && segments[0] !== 'onboarding') {
          router.replace('/onboarding');
        } else if (!inAuthGroup) {
          router.replace('/(auth)/login');
        }
      });
    }

    if (isAuthenticated && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated, segments]);

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
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="search" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="restaurant/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="food/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="checkout/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="checkout/address" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="checkout/payment" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="order-confirmation/[id]" options={{ animation: 'fade' }} />
        </Stack>
        <StatusBar style="auto" />
      </View>
    </QueryClientProvider>
  );
}
