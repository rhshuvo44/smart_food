import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants';

interface AvatarProps {
  name: string;
  size?: number;
  backgroundColor?: string;
}

export function Avatar({ name, size = 48, backgroundColor }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: backgroundColor || colors.primary + '20' },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center' },
  text: { fontWeight: '700', color: colors.primary },
});
