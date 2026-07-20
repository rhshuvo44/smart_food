import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Header } from '../../components/common/header';
import { SectionHeader } from '../../components/common/section-header';
import { colors, spacing, shadows, borderRadius } from '../../constants';

const REPORTS = [
  { title: 'Daily Sales Report', icon: '📅', desc: 'Today\'s revenue and orders summary' },
  { title: 'Weekly Performance', icon: '📊', desc: 'Week-over-week growth metrics' },
  { title: 'Top Restaurants', icon: '🏆', desc: 'Best performing restaurants' },
  { title: 'User Activity', icon: '👤', desc: 'User signups and engagement' },
];

export default function ReportsScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header title="Reports" subtitle="Download & view reports" />
      <SectionHeader title="Available Reports" />
      {REPORTS.map((r) => (
        <TouchableOpacity key={r.title} style={styles.card} activeOpacity={0.9}>
          <Text style={styles.cardIcon}>{r.icon}</Text>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{r.title}</Text>
            <Text style={styles.cardDesc}>{r.desc}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, padding: spacing.md, backgroundColor: colors.white, borderRadius: borderRadius.md, marginBottom: spacing.sm, ...shadows.sm },
  cardIcon: { fontSize: 28, marginRight: spacing.md },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  cardDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 20, color: colors.textTertiary },
});
