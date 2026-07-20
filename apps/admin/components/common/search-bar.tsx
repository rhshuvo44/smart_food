import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../constants';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onSubmit?: () => void;
}

export function SearchBar({ value, onChangeText, placeholder, onFocus, onSubmit }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        value={value} onChangeText={onChangeText}
        placeholder={placeholder || 'Search...'} placeholderTextColor={colors.textTertiary}
        style={styles.input} onFocus={onFocus} onSubmitEditing={onSubmit} returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearButton}>
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, height: 44, borderWidth: 1, borderColor: colors.border },
  icon: { fontSize: 16, marginRight: spacing.sm },
  input: { flex: 1, fontSize: 15, color: colors.text, height: '100%' },
  clearButton: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  clearIcon: { fontSize: 12, color: colors.textSecondary },
});
