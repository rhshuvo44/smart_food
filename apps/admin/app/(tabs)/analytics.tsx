import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform,
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { colors, spacing, borderRadius } from '../../constants';
import api from '../../services/api';

type Period = '7d' | '30d' | '90d';

interface RevenueData {
  period: number;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueByDay: Array<{ _id: string; revenue: number; orderCount: number }>;
}

interface OrderData {
  period: number;
  statusDistribution: Array<{ _id: string; count: number }>;
  ordersByDay: Array<{ _id: string; count: number }>;
}

interface UserData {
  totalUsers: number;
  newUsers: number;
  registrationsByDay: Array<{ _id: string; count: number }>;
  roleDistribution: Array<{ _id: string; count: number }>;
}

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<Period>('30d');
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [orders, setOrders] = useState<OrderData | null>(null);
  const [users, setUsers] = useState<UserData | null>(null);
  const [, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const [revRes, ordRes, userRes] = await Promise.all([
          api.get<{ success: boolean; data: RevenueData }>(
            `/admin/analytics/revenue?period=${period}`,
          ),
          api.get<{ success: boolean; data: OrderData }>(
            `/admin/analytics/orders?period=${period}`,
          ),
          api.get<{ success: boolean; data: UserData }>(`/admin/analytics/users?period=${period}`),
        ]);
        setRevenue(revRes.data.data);
        setOrders(ordRes.data.data);
        setUsers(userRes.data.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period],
  );

  useEffect(() => {
    fetchAll();
  }, [period]);

  const periods: Period[] = ['7d', '30d', '90d'];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAll(true)}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={styles.periodRow}>
            {periods.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                onPress={() => {
                  setPeriod(p);
                }}
              >
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Revenue Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue</Text>
          {revenue ? (
            <>
              <View style={styles.summaryRow}>
                <SummaryCard
                  label="Total Revenue"
                  value={`$${revenue.totalRevenue.toFixed(2)}`}
                  color={colors.success}
                />
                <SummaryCard
                  label="Total Orders"
                  value={revenue.totalOrders.toString()}
                  color={colors.primary}
                />
                <SummaryCard
                  label="Avg Order"
                  value={`$${revenue.averageOrderValue.toFixed(2)}`}
                  color={colors.secondary}
                />
              </View>
              <View style={styles.list}>
                {revenue.revenueByDay.slice(-14).map((day) => (
                  <View key={day._id} style={styles.listRow}>
                    <Text style={styles.listLabel}>{day._id}</Text>
                    <Text style={styles.listValue}>${day.revenue.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.loadingText}>Loading...</Text>
          )}
        </View>

        {/* Orders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders by Status</Text>
          {orders ? (
            <View style={styles.list}>
              {orders.statusDistribution.map((s) => (
                <View key={s._id} style={styles.listRow}>
                  <Text style={styles.listLabel}>{s._id}</Text>
                  <Text style={styles.listValue}>{s.count}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.loadingText}>Loading...</Text>
          )}
        </View>

        {/* Users Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Users</Text>
          {users ? (
            <>
              <View style={styles.summaryRow}>
                <SummaryCard
                  label="Total"
                  value={users.totalUsers.toString()}
                  color={colors.primary}
                />
                <SummaryCard
                  label="New ({period})"
                  value={users.newUsers.toString()}
                  color={colors.success}
                />
              </View>
              <View style={styles.list}>
                {users.roleDistribution.map((r) => (
                  <View key={r._id} style={styles.listRow}>
                    <Text style={styles.listLabel}>{r._id}</Text>
                    <Text style={styles.listValue}>{r.count}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.loadingText}>Loading...</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.summaryCard, { borderLeftColor: color }]}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xl },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: spacing.md },
  periodRow: { flexDirection: 'row', gap: spacing.sm },
  periodBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  periodBtnActive: { backgroundColor: '#FFFFFF' },
  periodText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  periodTextActive: { color: colors.primary },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderLeftWidth: 3,
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
  summaryValue: { fontSize: 18, fontWeight: '700' },
  summaryLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  list: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
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
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listLabel: { fontSize: 14, color: colors.text },
  listValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
