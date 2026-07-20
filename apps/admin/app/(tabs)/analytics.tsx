import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Header } from '../../components/common/header';
import { StatCard } from '../../components/common/stat-card';
import { SectionHeader } from '../../components/common/section-header';
import { colors, spacing, shadows, borderRadius } from '../../constants';

const METRICS = [
  { title: 'Avg Order Value', value: '$24.50', icon: '💳', color: colors.primary },
  { title: 'Conversion Rate', value: '68%', icon: '📊', color: colors.success },
  { title: 'Top Category', value: 'Pizza', icon: '🍕', color: colors.secondary },
  { title: 'Peak Hours', value: '6-9 PM', icon: '⏰', color: colors.info },
];

export default function AnalyticsScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header title="Analytics" subtitle="Platform metrics" />
      <View style={styles.grid}>
        {METRICS.map((m) => (
          <StatCard key={m.title} {...m} />
        ))}
      </View>

      <SectionHeader title="Trending Now" />
      <View style={styles.trendCard}>
        <Text style={styles.trendEmoji}>🔥</Text>
        <Text style={styles.trendText}>Pizza orders up 24% this week</Text>
      </View>
      <View style={styles.trendCard}>
        <Text style={styles.trendEmoji}>📈</Text>
        <Text style={styles.trendText}>New user signups +18%</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  grid: { padding: spacing.md, gap: spacing.sm },
  trendCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, padding: spacing.md, backgroundColor: colors.white, borderRadius: borderRadius.md, marginBottom: spacing.sm, ...shadows.sm },
  trendEmoji: { fontSize: 24, marginRight: spacing.md },
  trendText: { fontSize: 14, fontWeight: '500', color: colors.text, flex: 1 },
});
