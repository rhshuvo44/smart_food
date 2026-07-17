import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface UserListItem {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface UsersResponse {
  success: boolean;
  data: {
    users: UserListItem[];
  };
}

export function useUsers(search: string = '', roleFilter: string = '') {
  return useQuery<UserListItem[]>({
    queryKey: ['admin', 'users', { search, roleFilter }],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;

      const response = await api.get<UsersResponse>('/admin/users', { params });
      return response.data.data.users;
    },
    staleTime: 30 * 1000,
    retry: 2,
  });
}
