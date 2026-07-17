import { View, Text } from 'react-native';
interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: string;
}
export function EmptyState({ title, subtitle, icon = '📭' }: EmptyStateProps) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>{icon}</Text>
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1A2E', marginBottom: 8 }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: 14, color: '#6C757D', textAlign: 'center' }}>{subtitle}</Text>
      )}
    </View>
  );
}
