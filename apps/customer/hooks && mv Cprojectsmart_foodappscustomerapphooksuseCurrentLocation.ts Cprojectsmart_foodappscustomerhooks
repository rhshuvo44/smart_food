import { useAuthStore } from '../../stores/auth.store';

export function useAuth() {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  return {
    isAuthenticated,
    user,
    isLoading,
    logout: () => useAuthStore.getState().clearAuth(),
  };
}
