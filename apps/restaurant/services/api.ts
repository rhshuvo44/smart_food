import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export async function loadStoredTokens(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      accessToken = token;
    }
    return token;
  } catch {
    return null;
  }
}

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken && !error.config._retry) {
          error.config._retry = true;
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data.tokens;
          accessToken = newAccess;
          await SecureStore.setItemAsync('accessToken', newAccess);
          await SecureStore.setItemAsync('refreshToken', newRefresh);
          error.config.headers.Authorization = `Bearer ${newAccess}`;
          return api(error.config);
        }
      } catch {
        accessToken = null;
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }
    return Promise.reject(error);
  },
);

export default api;
