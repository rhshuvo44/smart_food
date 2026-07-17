import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { router } from 'expo-router';
import { forgotPassword } from '../../services/auth.service';
import { isValidEmail, isEmpty } from '../../utils/validation';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  function validate(): boolean {
    if (isEmpty(email)) {
      setError('Email is required');
      return false;
    }
    if (!isValidEmail(email)) {
      setError('Invalid email format');
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const message = await forgotPassword(email);
      setSent(true);
      Alert.alert('Check Your Email', message);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      const message =
        axiosError?.response?.data?.error?.message || 'Something went wrong. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FFFFFF' }}>
        <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>✉️</Text>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: '#1A1A2E',
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          Check Your Email
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: '#6C757D',
            marginBottom: 32,
            textAlign: 'center',
            lineHeight: 22,
          }}
        >
          If an account exists for {email}, you'll receive a password reset link shortly.
        </Text>
        <Button
          title="Back to Sign In"
          onPress={() => router.push('/(auth)/login')}
          variant="primary"
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FFFFFF' }}>
      <Text
        style={{
          fontSize: 28,
          fontWeight: '700',
          color: '#1A1A2E',
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        Forgot Password
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: '#6C757D',
          marginBottom: 32,
          textAlign: 'center',
          lineHeight: 22,
        }}
      >
        Enter your email address and we'll send you a link to reset your password.
      </Text>

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
        variant="primary"
        loading={loading}
        style={{ marginTop: 8 }}
      />

      <Button
        title="Back to Sign In"
        onPress={() => router.push('/(auth)/login')}
        variant="ghost"
        style={{ marginTop: 16 }}
      />
    </View>
  );
}
