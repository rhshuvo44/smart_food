import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { router } from 'expo-router';
import { loginUser } from '../../services/auth.service';
import { isValidEmail, isEmpty } from '../../utils/validation';

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
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      await loginUser(email, password);
      router.replace('/(tabs)');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
      const message =
        axiosError?.response?.data?.error?.message ||
        'Login failed. Please check your credentials.';
      Alert.alert('Login Failed', message);
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
        Welcome Back
      </Text>
      <Text style={{ fontSize: 16, color: '#6C757D', marginBottom: 32, textAlign: 'center' }}>
        Sign in to continue ordering
      </Text>

      <Input
        label="Email"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          setErrors((e) => ({ ...e, email: undefined }));
        }}
        placeholder="Enter your email"
        keyboardType="email-address"
        error={errors.email}
      />
      <Input
        label="Password"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          setErrors((e) => ({ ...e, password: undefined }));
        }}
        placeholder="Enter your password"
        secureTextEntry
        error={errors.password}
      />

      <Button
        title="Sign In"
        onPress={handleLogin}
        variant="primary"
        loading={loading}
        style={{ marginTop: 8 }}
      />

      <Button
        title="Forgot Password?"
        onPress={() => router.push('/(auth)/forgot-password')}
        variant="ghost"
        style={{ marginTop: 8 }}
      />

      <Button
        title="Don't have an account? Register"
        onPress={() => router.push('/(auth)/register')}
        variant="ghost"
        style={{ marginTop: 8 }}
      />
    </View>
  );
}
