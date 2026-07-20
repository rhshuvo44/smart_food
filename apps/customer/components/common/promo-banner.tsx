import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../constants';

interface PromoBannerProps {
  title: string;
  subtitle: string;
  emoji: string;
  color?: string;
  onPress?: () => void;
}

export function PromoBanner({ title, subtitle, emoji, color = colors.primary, onPress }: PromoBannerProps) {
  return (
    <TouchableOpacity
      style={[styles.banner, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.emoji}>{emoji}</Text>
    </TouchableOpacity>
  );
}

export function PromoBannerCarousel() {
  const banners = [
    { title: 'Free Delivery', subtitle: 'On orders over $20', emoji: '🚚', color: colors.primary },
    { title: '50% OFF', subtitle: 'First order discount', emoji: '🔥', color: '#E55A2B' },
    { title: 'New Restaurants', subtitle: 'Explore new flavors', emoji: '🎉', color: '#2D2D44' },
  ];

  return (
    <View style={styles.carousel}>
      {banners.map((b, i) => (
        <PromoBanner key={i} {...b} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  carousel: { marginBottom: spacing.md },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  textContainer: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', color: colors.white },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  emoji: { fontSize: 40, marginLeft: spacing.md },
});
