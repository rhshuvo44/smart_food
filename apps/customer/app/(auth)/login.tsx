import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { Divider } from '../../components/common/divider';
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
      setErrors({ password: 'Invalid email or password' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🍕</Text>
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue ordering your favorites</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
            placeholder="Enter your email"
            keyboardType="email-address"
            error={errors.email}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
            placeholder="Enter your password"
            secureTextEntry
            error={errors.password}
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            variant="primary"
            loading={loading}
            style={styles.signInButton}
          />

          <TouchableOpacityButton
            title="Forgot Password?"
            onPress={() => router.push('/(auth)/forgot-password')}
          />
        </View>

        <View style={styles.socialSection}>
          <Divider spacing={spacing.md} />
          <Text style={styles.socialLabel}>Or continue with</Text>
          <View style={styles.socialRow}>
            <SocialButton icon="🔵" label="Google" />
            <SocialButton icon="🍎" label="Apple" />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Button
            title="Register"
            onPress={() => router.push('/(auth)/register')}
            variant="ghost"
            style={styles.footerButton}
            textStyle={styles.footerButtonText}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TouchableOpacityButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', marginTop: spacing.sm }}>
      <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '500' }}>{title}</Text>
    </TouchableOpacity>
  );
}

function SocialButton({ icon, label }: { icon: string; label: string }) {
  return (
    <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
      <Text style={styles.socialButtonIcon}>{icon}</Text>
      <Text style={styles.socialButtonLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, flexGrow: 1, justifyContent: 'center' },
  headerSection: { alignItems: 'center', marginBottom: spacing.xl },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoEmoji: { fontSize: 36 },
  title: { ...typography.h1, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  form: { marginBottom: spacing.md },
  signInButton: { marginTop: spacing.sm },
  socialSection: { marginBottom: spacing.lg },
  socialLabel: { fontSize: 13, color: colors.textTertiary, textAlign: 'center', marginBottom: spacing.md },
  socialRow: { flexDirection: 'row', gap: spacing.md },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  socialButtonIcon: { fontSize: 18, marginRight: spacing.sm },
  socialButtonLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14, color: colors.textSecondary },
  footerButton: { paddingVertical: 0, paddingHorizontal: 4, borderWidth: 0 },
  footerButtonText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
});
