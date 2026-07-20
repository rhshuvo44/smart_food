import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

const KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_ID: 'userId',
  ONBOARDING_SEEN: 'onboarding_seen',
} as const;

let webStore: Record<string, string> = {};

async function getSecureStore() {
  if (isWeb) return null;
  try {
    const SecureStore = await import('expo-secure-store');
    return SecureStore;
  } catch {
    return null;
  }
}

export async function storeSecureItem(key: string, value: string): Promise<void> {
  const SecureStore = await getSecureStore();
  if (SecureStore) {
    await SecureStore.setItemAsync(key, value);
  } else {
    webStore[key] = value;
  }
}

export async function getSecureItem(key: string): Promise<string | null> {
  const SecureStore = await getSecureStore();
  if (SecureStore) {
    return SecureStore.getItemAsync(key);
  }
  return webStore[key] ?? null;
}

export async function removeSecureItem(key: string): Promise<void> {
  const SecureStore = await getSecureStore();
  if (SecureStore) {
    await SecureStore.deleteItemAsync(key);
  } else {
    delete webStore[key];
  }
}

export async function getItem(key: string): Promise<string | null> {
  return getSecureItem(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  return storeSecureItem(key, value);
}

export async function removeItem(key: string): Promise<void> {
  return removeSecureItem(key);
}

export async function storeTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    storeSecureItem(KEYS.ACCESS_TOKEN, accessToken),
    storeSecureItem(KEYS.REFRESH_TOKEN, refreshToken),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return getSecureItem(KEYS.ACCESS_TOKEN);
}

export async function clearAuthStorage(): Promise<void> {
  await Promise.all([
    removeSecureItem(KEYS.ACCESS_TOKEN),
    removeSecureItem(KEYS.REFRESH_TOKEN),
    removeSecureItem(KEYS.USER_ID),
  ]);
}

export const secureStorageAdapter = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await getSecureItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await storeSecureItem(name, value);
    } catch {}
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await removeSecureItem(name);
    } catch {}
  },
};

export { KEYS };
