import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { router } from 'expo-router';
import { loginUser } from '../../services/auth.service';
import { isValidEmail, isEmpty } from '../../utils/validation';
import { colors, spacing, typography } from '../../constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const newErrors: { email?: string; password?: string } = {};
    if (isEmpty(email)) newErrors.email = 'Email is required';
    else if (!isValidEmail(email)) newErrors.email = 'Invalid email format';
    if (isEmpty(password)) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      await loginUser(email, password);
      router.replace('/(tabs)');
    } catch {
      setErrors({ password: 'Invalid credentials' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>⚙️</Text>
          </View>
          <Text style={styles.title}>Admin Login</Text>
          <Text style={styles.subtitle}>Sign in to manage the platform</Text>
        </View>
        <View style={styles.form}>
          <Input label="Email" value={email} onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }} placeholder="Enter your email" keyboardType="email-address" error={errors.email} />
          <Input label="Password" value={password} onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }} placeholder="Enter your password" secureTextEntry error={errors.password} />
          <Button title="Sign In" onPress={handleLogin} variant="primary" loading={loading} style={styles.signInButton} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, flexGrow: 1, justifyContent: 'center' },
  headerSection: { alignItems: 'center', marginBottom: spacing.xl },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  logoEmoji: { fontSize: 36 },
  title: { ...typography.h1, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  form: { marginBottom: spacing.md },
  signInButton: { marginTop: spacing.sm },
});
