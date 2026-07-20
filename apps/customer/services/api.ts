import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { removeSecureItem, getAccessToken as getStoredAccessToken } from '../utils/storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
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
      setAccessToken(null);
      await removeSecureItem('accessToken');
      await removeSecureItem('refreshToken');
    }
    return Promise.reject(error);
  },
);

export async function loadStoredTokens(): Promise<void> {
  const token = await getStoredAccessToken();
  if (token) {
    setAccessToken(token);
  }
}

export default api;
