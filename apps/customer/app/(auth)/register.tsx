import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { router } from 'expo-router';
import { registerUser } from '../../services/auth.service';
import { isValidEmail, isValidPhone, isValidPassword, isEmpty } from '../../utils/validation';
import { colors, spacing, typography } from '../../constants';

export default function RegisterScreen() {
  const [step, setStep] = useState<'info' | 'password'>('info');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  function validateInfo(): boolean {
    const newErrors: Record<string, string> = {};
    if (isEmpty(firstName)) newErrors.firstName = 'First name is required';
    if (isEmpty(lastName)) newErrors.lastName = 'Last name is required';
    if (isEmpty(email)) newErrors.email = 'Email is required';
    else if (!isValidEmail(email)) newErrors.email = 'Invalid email format';
    if (phone && !isValidPhone(phone)) newErrors.phone = 'Invalid phone number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validatePassword(): boolean {
    const newErrors: Record<string, string> = {};
    if (isEmpty(password)) newErrors.password = 'Password is required';
    else if (!isValidPassword(password))
      newErrors.password = 'Must be 8+ chars with uppercase, lowercase, and number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validatePassword()) return;
    setLoading(true);
    try {
      await registerUser({ firstName, lastName, email, phone: phone || undefined, password });
      router.replace('/(tabs)');
    } catch {
      setErrors({ password: 'Registration failed. Please try again.' });
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join SmartFood and start ordering</Text>
        </View>

        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step === 'password' && styles.stepDotActive]} />
        </View>

        {step === 'info' ? (
          <View style={styles.form}>
            <Input
              label="First Name"
              value={firstName}
              onChangeText={(t) => { setFirstName(t); setErrors((e) => ({ ...e, firstName: undefined })); }}
              placeholder="Enter your first name"
              error={errors.firstName}
            />
            <Input
              label="Last Name"
              value={lastName}
              onChangeText={(t) => { setLastName(t); setErrors((e) => ({ ...e, lastName: undefined })); }}
              placeholder="Enter your last name"
              error={errors.lastName}
            />
            <Input
              label="Email"
              value={email}
              onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
              placeholder="Enter your email"
              keyboardType="email-address"
              error={errors.email}
            />
            <Input
              label="Phone (optional)"
              value={phone}
              onChangeText={(t) => { setPhone(t); setErrors((e) => ({ ...e, phone: undefined })); }}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              error={errors.phone}
            />
            <Button
              title="Continue"
              onPress={() => { if (validateInfo()) setStep('password'); }}
              variant="primary"
              style={styles.continueButton}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Input
              label="Create Password"
              value={password}
              onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
              placeholder="Create a strong password"
              secureTextEntry
              error={errors.password}
            />
            <Text style={styles.passwordHint}>
              Must be at least 8 characters with uppercase, lowercase, and a number
            </Text>
            <Button
              title="Create Account"
              onPress={handleRegister}
              variant="primary"
              loading={loading}
              style={styles.continueButton}
            />
            <Button
              title="← Back"
              onPress={() => setStep('info')}
              variant="ghost"
            />
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Button
            title="Sign In"
            onPress={() => router.back()}
            variant="ghost"
            style={{ paddingVertical: 0, paddingHorizontal: 4, borderWidth: 0 }}
            textStyle={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, flexGrow: 1, justifyContent: 'center' },
  headerSection: { alignItems: 'center', marginBottom: spacing.lg },
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  stepDotActive: { backgroundColor: colors.primary, width: 14, height: 14, borderRadius: 7 },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  form: { marginBottom: spacing.md },
  continueButton: { marginTop: spacing.sm },
  passwordHint: { fontSize: 12, color: colors.textTertiary, marginTop: -8, marginBottom: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14, color: colors.textSecondary },
});
