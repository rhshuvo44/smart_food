import { View, TextInput, Text, type ViewStyle, type TextStyle } from 'react-native';
import { colors, borderRadius } from '../../constants';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  style?: ViewStyle;
  inputStyle?: TextStyle;
}

export function Input({ label, value, onChangeText, placeholder, error, secureTextEntry, autoCapitalize = 'none', keyboardType = 'default', style, inputStyle }: InputProps) {
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        secureTextEntry={secureTextEntry} autoCapitalize={autoCapitalize} keyboardType={keyboardType}
        style={[{ borderWidth: 1, borderColor: error ? colors.error : colors.border, borderRadius: borderRadius.md, paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, color: colors.text, backgroundColor: colors.white }, inputStyle]}
        placeholderTextColor={colors.textTertiary}
      />
      {error && <Text style={{ fontSize: 12, color: colors.error, marginTop: 4 }}>{error}</Text>}
    </View>
  );
}
