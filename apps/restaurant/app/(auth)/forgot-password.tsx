import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { router } from 'expo-router';
import { useState } from 'react';
import { isValidEmail, isEmpty } from '../../utils/validation';
import { colors, spacing, typography } from '../../constants';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (isEmpty(email)) { setError('Email is required'); return; }
    if (!isValidEmail(email)) { setError('Invalid email format'); return; }
    setLoading(true);
    setError('');
    try {
      // await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🔒</Text>
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your email to receive reset instructions</Text>
        </View>

        {sent ? (
          <View style={styles.sentContainer}>
            <Text style={styles.sentEmoji}>📧</Text>
            <Text style={styles.sentTitle}>Email Sent</Text>
            <Text style={styles.sentText}>Check your inbox for password reset instructions.</Text>
            <Button title="Back to Login" onPress={() => router.push('/(auth)/login')} variant="primary" style={styles.backBtn} />
          </View>
        ) : (
          <>
            <Input label="Email" value={email} onChangeText={(t) => { setEmail(t); setError(''); }} placeholder="Enter your email" keyboardType="email-address" error={error} />
            <Button title="Send Reset Link" onPress={handleReset} variant="secondary" loading={loading} style={styles.resetBtn} />
            <Button title="Back to Login" onPress={() => router.push('/(auth)/login')} variant="ghost" style={styles.backBtn} />
          </>
        )}
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
  sentContainer: { alignItems: 'center', paddingVertical: spacing.lg },
  sentEmoji: { fontSize: 48, marginBottom: spacing.md },
  sentTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  sentText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  resetBtn: { marginTop: 8 },
  backBtn: { marginTop: 16 },
});
