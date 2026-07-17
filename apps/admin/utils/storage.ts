import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_ID: 'userId',
} as const;

export async function storeSecureItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function getSecureItem(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function removeSecureItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
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

export { KEYS };
