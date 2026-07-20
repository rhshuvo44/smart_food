import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../../components/common/header';
import { Avatar } from '../../components/common/avatar';
import { StatusBadge } from '../../components/common/status-badge';
import { LoadingScreen } from '../../components/common/loading-screen';
import { EmptyState } from '../../components/common/empty-state';
import { colors, spacing, shadows, borderRadius } from '../../constants';
import api from '../../services/api';
import type { IUser, IApiResponse } from '../../types';

export default function UsersScreen() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await api.get<IApiResponse<{ users: IUser[] }>>('/admin/users');
      return data.data?.users ?? [];
    },
  });

  if (isLoading) return <LoadingScreen message="Loading users..." />;

  return (
    <View style={styles.container}>
      <Header title="Users" subtitle="Manage platform users" />
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.9}>
            <View style={styles.leftCol}>
              <Avatar name={`${item.firstName} ${item.lastName}`} size={40} />
            </View>
            <View style={styles.middleCol}>
              <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>
            <StatusBadge status={item.role || 'customer'} size="sm" colorMap={{ customer: colors.info, admin: colors.primary, restaurant_owner: colors.secondary }} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState title="No users" icon="👥" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
  leftCol: { marginRight: spacing.md },
  middleCol: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  email: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
