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
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { resetPassword } from '../../services/auth.service';
import { isValidPassword, isEmpty } from '../../utils/validation';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const validate = (): boolean => {
    const newErrors: { password?: string; confirmPassword?: string } = {};
    if (isEmpty(password)) newErrors.password = 'Password is required';
    else if (!isValidPassword(password))
      newErrors.password = 'Min 8 characters, 1 uppercase, 1 number';
    if (isEmpty(confirmPassword)) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;
    if (!token) {
      Alert.alert('Error', 'Invalid reset link. Please request a new one.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      Alert.alert('Success', 'Your password has been reset successfully.', [
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Reset failed. The link may have expired.';
      Alert.alert('Reset Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your new password</Text>
        </View>

        <Input
          label="New Password"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
          }}
          placeholder="Min 8 characters, 1 uppercase, 1 number"
          secureTextEntry
          error={errors.password}
        />

        <Input
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={(t) => {
            setConfirmPassword(t);
            if (errors.confirmPassword) setErrors((e) => ({ ...e, confirmPassword: undefined }));
          }}
          placeholder="Re-enter your new password"
          secureTextEntry
          error={errors.confirmPassword}
        />

        <Button
          title="Reset Password"
          onPress={handleReset}
          variant="secondary"
          loading={loading}
          style={styles.resetBtn}
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
  resetBtn: { marginTop: 8 },
  backBtn: { marginTop: 16 },
});
