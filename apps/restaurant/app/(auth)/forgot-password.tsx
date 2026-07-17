import {
  View,
  Text,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { router } from 'expo-router';
import { useState } from 'react';
import { forgotPassword } from '../../services/auth.service';
import { isValidEmail, isEmpty } from '../../utils/validation';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const validate = (): boolean => {
    if (isEmpty(email)) {
      setError('Email is required');
      return false;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Something went wrong. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.sentContainer}>
          <Text style={styles.sentIcon}>📧</Text>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.sentMessage}>If that email exists, a reset link has been sent.</Text>
          <Button
            title="Back to Sign In"
            onPress={() => router.push('/(auth)/login')}
            variant="primary"
            style={styles.backBtn}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter your email and we'll send you a reset link</Text>
        </View>

        <Input
          label="Email"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setError('');
          }}
          placeholder="Enter your email"
          keyboardType="email-address"
          error={error}
        />

        <Button
          title="Send Reset Link"
          onPress={handleSubmit}
          variant="secondary"
          loading={loading}
          style={styles.submitBtn}
        />

        <Button
          title="Back to Sign In"
          onPress={() => router.push('/(auth)/login')}
          variant="ghost"
          style={styles.backBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A2E', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6C757D', textAlign: 'center', marginTop: 8 },
  submitBtn: { marginTop: 8 },
  backBtn: { marginTop: 16 },
  sentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  sentIcon: { fontSize: 64, marginBottom: 16 },
  sentMessage: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
});
