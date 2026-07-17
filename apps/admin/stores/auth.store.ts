import { create } from 'zustand';
import type { IUser } from '@smartfood/shared';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: IUser | null;
  setUser: (user: IUser) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  setUser: (user) => set({ isAuthenticated: true, user, isLoading: false }),
  clearAuth: () => set({ isAuthenticated: false, user: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
