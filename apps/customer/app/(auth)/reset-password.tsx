import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { router, useLocalSearchParams } from 'expo-router';
import { resetPassword } from '../../services/auth.service';
import { isValidPassword, isEmpty } from '../../utils/validation';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (isEmpty(password)) newErrors.password = 'Password is required';
    else if (!isValidPassword(password))
      newErrors.password = 'Must be 8+ chars with uppercase, lowercase, and number';
    if (isEmpty(confirmPassword)) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleReset() {
    if (!validate()) return;
    if (!token) {
      Alert.alert('Error', 'Invalid reset link. Please request a new one.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      Alert.alert('Success', 'Password has been reset successfully.', [
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      const message =
        axiosError?.response?.data?.error?.message || 'Password reset failed. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
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
        Reset Password
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
        Enter your new password below.
      </Text>

      <Input
        label="New Password"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          setErrors((e) => ({ ...e, password: undefined }));
        }}
        placeholder="Enter new password"
        secureTextEntry
        error={errors.password}
      />
      <Input
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={(t) => {
          setConfirmPassword(t);
          setErrors((e) => ({ ...e, confirmPassword: undefined }));
        }}
        placeholder="Confirm new password"
        secureTextEntry
        error={errors.confirmPassword}
      />

      <Button
        title="Reset Password"
        onPress={handleReset}
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
