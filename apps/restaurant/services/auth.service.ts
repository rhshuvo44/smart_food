import api from './api';
import { storeTokens, clearAuthStorage } from '../utils/storage';
import { setAccessToken } from './api';
import { useAuthStore } from '../stores/auth.store';
import type { IUser, IAuthTokens } from '@smartfood/shared';

interface RegisterRestaurantData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface AuthResponse {
  user: IUser;
  tokens: IAuthTokens;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', {
    email,
    password,
  });
  const data = response.data.data;

  await storeTokens(data.tokens.accessToken, data.tokens.refreshToken);
  setAccessToken(data.tokens.accessToken);

  return data;
}

export async function registerUser(data: RegisterRestaurantData): Promise<AuthResponse> {
  const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/register', {
    ...data,
    role: 'restaurant_owner',
  });
  const result = response.data.data;

  await storeTokens(result.tokens.accessToken, result.tokens.refreshToken);
  setAccessToken(result.tokens.accessToken);

  return result;
}

export async function logoutUser(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // Even if the API call fails, clear local state
  } finally {
    await clearAuthStorage();
    setAccessToken(null);
    useAuthStore.getState().clearAuth();
  }
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post('/auth/reset-password', { token, password });
}

export async function fetchProfile(): Promise<IUser> {
  const response = await api.get<{ success: boolean; data: { user: IUser } }>('/auth/me');
  return response.data.data.user;
}
