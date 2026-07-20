import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { router } from 'expo-router';
import { useState } from 'react';
import { isValidPassword, isEmpty } from '../../utils/validation';
import { colors, spacing, typography } from '../../constants';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleReset = async () => {
    const newErrors: Record<string, string> = {};
    if (isEmpty(password)) newErrors.password = 'Password is required';
    else if (!isValidPassword(password)) newErrors.password = 'Min 8 characters, 1 uppercase, 1 number';
    if (isEmpty(confirmPassword)) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      // await api.post('/auth/reset-password', { token, password });
      router.replace('/(auth)/login');
    } catch {
      setErrors({ password: 'Reset failed. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🔑</Text>
          </View>
          <Text style={styles.title}>New Password</Text>
          <Text style={styles.subtitle}>Enter your new password</Text>
        </View>

        <Input label="New Password" value={password} onChangeText={(t) => { setPassword(t); setErrors({}); }} placeholder="Enter new password" secureTextEntry error={errors.password} />
        <Input label="Confirm Password" value={confirmPassword} onChangeText={(t) => { setConfirmPassword(t); setErrors({}); }} placeholder="Confirm new password" secureTextEntry error={errors.confirmPassword} />

        <Button title="Reset Password" onPress={handleReset} variant="secondary" loading={loading} style={styles.resetBtn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  headerSection: { alignItems: 'center', marginBottom: spacing.xl },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  logoEmoji: { fontSize: 36 },
  title: { ...typography.h1, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  resetBtn: { marginTop: 8 },
});
