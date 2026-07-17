import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { colors, spacing, borderRadius } from '../../constants';
import api from '../../services/api';

interface Report {
  id: string;
  title: string;
  description: string;
  icon: string;
  endpoint: string;
}

const REPORTS: Report[] = [
  {
    id: 'users',
    title: 'Users Report',
    description: 'Export all registered users with roles and status',
    icon: '👥',
    endpoint: '/admin/reports/users',
  },
  {
    id: 'orders',
    title: 'Orders Report',
    description: 'Export order data with status, revenue, and items',
    icon: '📋',
    endpoint: '/admin/reports/orders',
  },
  {
    id: 'revenue',
    title: 'Revenue Report',
    description: 'Export revenue breakdown by day and restaurant',
    icon: '💰',
    endpoint: '/admin/reports/revenue',
  },
  {
    id: 'restaurants',
    title: 'Restaurants Report',
    description: 'Export all restaurants with performance metrics',
    icon: '🏪',
    endpoint: '/admin/reports/restaurants',
  },
];

export default function ReportsScreen() {
  const [loading, setLoading] = useState<string | null>(null);

  async function downloadReport(report: Report) {
    setLoading(report.id);
    try {
      const response = await api.get(report.endpoint, { responseType: 'json' });
      const blob = JSON.stringify(response.data, null, 2);

      Alert.alert(
        'Report Ready',
        `${report.title} data has been fetched (${blob.length} bytes).\n\nIn a production app, this would trigger a file download.`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch report';
      Alert.alert('Error', message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>Export platform data</Text>
        </View>

        {REPORTS.map((report) => (
          <TouchableOpacity
            key={report.id}
            style={styles.card}
            onPress={() => downloadReport(report)}
            disabled={loading === report.id}
          >
            <Text style={styles.cardIcon}>{report.icon}</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{report.title}</Text>
              <Text style={styles.cardDesc}>{report.description}</Text>
            </View>
            <Text style={styles.downloadIcon}>{loading === report.id ? '⏳' : '⬇️'}</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.note}>
          <Text style={styles.noteText}>
            Reports are exported as JSON. CSV/PDF export will be available in a future release.
          </Text>
        </View>
      </ScrollView>
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
  title: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
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
  cardIcon: { fontSize: 32, marginRight: spacing.md },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  downloadIcon: { fontSize: 20, marginLeft: spacing.sm },
  note: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: '#F8F9FA',
    borderRadius: borderRadius.md,
  },
  noteText: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
});
