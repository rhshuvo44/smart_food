import { View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { router } from 'expo-router';
import { useState } from 'react';
import { loginUser } from '../../services/auth.service';
import { useAuthStore } from '../../stores/auth.store';
import { isValidEmail, isValidPassword, isEmpty } from '../../utils/validation';
import { colors, spacing, typography } from '../../constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const setAuth = useAuthStore((s) => s.setAuth);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    if (isEmpty(email)) newErrors.email = 'Email is required';
    else if (!isValidEmail(email)) newErrors.email = 'Please enter a valid email';
    if (isEmpty(password)) newErrors.password = 'Password is required';
    else if (!isValidPassword(password)) newErrors.password = 'Min 8 characters, 1 uppercase, 1 number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await loginUser(email, password);
      setAuth(result.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrors({ password: err?.response?.data?.error?.message || 'Invalid credentials' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🍽️</Text>
          </View>
          <Text style={styles.title}>Restaurant Portal</Text>
          <Text style={styles.subtitle}>Sign in to manage your restaurant</Text>
        </View>

        <Input label="Email" value={email} onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }} placeholder="Enter your email" keyboardType="email-address" error={errors.email} />
        <Input label="Password" value={password} onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }} placeholder="Enter your password" secureTextEntry error={errors.password} />

        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotLink}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <Button title="Sign In" onPress={handleLogin} variant="secondary" loading={loading} style={styles.signInBtn} />
        <Button title="Register your restaurant" onPress={() => router.push('/(auth)/register')} variant="ghost" style={styles.registerBtn} />
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
  forgotLink: { alignSelf: 'flex-end', marginBottom: 16 },
  forgotText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  signInBtn: { marginTop: 8 },
  registerBtn: { marginTop: 16 },
});
