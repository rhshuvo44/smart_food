import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { colors, spacing, borderRadius } from '../../constants';
import api from '../../services/api';

const ROLE_COLORS: Record<string, string> = {
  admin: '#DC3545',
  super_admin: '#DC3545',
  restaurant_owner: colors.secondary,
  restaurant_staff: colors.warning,
  customer: colors.primary,
  delivery_driver: '#17A2B8',
};

interface UserItem {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UsersScreen() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params: Record<string, string> = {};
        if (search.trim()) params.search = search.trim();
        if (roleFilter) params.role = roleFilter;

        const res = await api.get('/admin/users', { params });
        setUsers(res.data.data.users);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, roleFilter],
  );

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const ROLES = ['', 'admin', 'super_admin', 'restaurant_owner', 'customer', 'delivery_driver'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <TextInput
          style={styles.search}
          placeholder="Search name or email..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => fetchUsers()}
        />
      </View>

      {/* Role filter */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.roleRow}
        data={ROLES}
        keyExtractor={(r) => r || 'all'}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.roleChip, roleFilter === item && styles.roleChipActive]}
            onPress={() => {
              setRoleFilter(item);
            }}
          >
            <Text style={[styles.roleChipText, roleFilter === item && styles.roleChipTextActive]}>
              {item || 'All'}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={users}
        keyExtractor={(u) => u._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchUsers(true)}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userCard}
            onPress={() =>
              router.push({ pathname: '/(tabs)/user-detail', params: { userId: item._id } })
            }
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(item.firstName?.charAt(0) || '?').toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {item.firstName} {item.lastName}
              </Text>
              <Text style={styles.userEmail}>{item.email}</Text>
              <View style={styles.userMeta}>
                <View
                  style={[
                    styles.roleBadge,
                    { backgroundColor: (ROLE_COLORS[item.role] || colors.textSecondary) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.roleText,
                      { color: ROLE_COLORS[item.role] || colors.textSecondary },
                    ]}
                  >
                    {item.role.replace(/_/g, ' ')}
                  </Text>
                </View>
                {!item.isActive && <Text style={styles.inactiveText}>Inactive</Text>}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: spacing.sm },
  search: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.md,
    padding: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    color: '#FFFFFF',
  },
  roleRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: '#F0F0F0',
  },
  roleChipActive: { backgroundColor: colors.secondary },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  roleChipTextActive: { color: '#FFFFFF' },
  list: { padding: spacing.md },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: colors.text },
  userEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  userMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: spacing.sm },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.full },
  roleText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  inactiveText: { fontSize: 11, color: colors.error, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: colors.textSecondary },
});
