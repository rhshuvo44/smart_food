import { View, TextInput, Text, type ViewStyle } from 'react-native';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  style?: ViewStyle;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType = 'default',
  style,
}: InputProps) {
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1A2E', marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={{
          borderWidth: 1,
          borderColor: error ? '#DC3545' : '#DEE2E6',
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 16,
          fontSize: 16,
          color: '#1A1A2E',
          backgroundColor: '#FFFFFF',
        }}
        placeholderTextColor="#6C757D"
      />
      {error && <Text style={{ fontSize: 12, color: '#DC3545', marginTop: 4 }}>{error}</Text>}
    </View>
  );
}
