import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface UserDetail {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface UserResponse {
  success: boolean;
  data: {
    user: UserDetail;
  };
}

export function useUser(userId: string | undefined) {
  return useQuery<UserDetail>({
    queryKey: ['admin', 'user', userId],
    queryFn: async () => {
      const response = await api.get<UserResponse>(`/admin/users/${userId}`);
      return response.data.data.user;
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
    retry: 2,
  });
}
