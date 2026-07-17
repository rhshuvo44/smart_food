import api, { setAccessToken } from './api';
import { storeTokens, clearAuthStorage } from '../utils/storage';
import { useAuthStore } from '../stores/auth.store';
import type { IUser, IAuthTokens } from '@smartfood/shared';

interface LoginResponse {
  success: boolean;
  data: {
    user: IUser;
    tokens: IAuthTokens;
  };
}

interface ProfileResponse {
  success: boolean;
  data: {
    user: IUser;
  };
}

export async function loginUser(email: string, password: string): Promise<IUser> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  const { user, tokens } = data.data;

  await storeTokens(tokens.accessToken, tokens.refreshToken);
  setAccessToken(tokens.accessToken);
  useAuthStore.getState().setUser(user);

  return user;
}

export async function logoutUser(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // Ignore logout API errors
  }
  setAccessToken(null);
  await clearAuthStorage();
  useAuthStore.getState().clearAuth();
}

export async function fetchProfile(): Promise<IUser> {
  const { data } = await api.get<ProfileResponse>('/auth/me');
  const { user } = data.data;

  useAuthStore.getState().setUser(user);

  return user;
}
