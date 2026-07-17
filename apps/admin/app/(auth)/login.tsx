import { View, Text } from 'react-native';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { useState } from 'react';
import { router } from 'expo-router';
import { loginUser } from '../../services/auth.service';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await loginUser(email, password);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const message =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data: { error: { message: string } } } }).response?.data?.error
              ?.message
          : null) || 'Login failed. Please try again.';
      setError(message);
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
        Admin Panel
      </Text>
      <Text style={{ fontSize: 16, color: '#6C757D', marginBottom: 32, textAlign: 'center' }}>
        Platform administration
      </Text>
      {error ? (
        <Text style={{ fontSize: 14, color: '#DC3545', textAlign: 'center', marginBottom: 16 }}>
          {error}
        </Text>
      ) : null}
      <Input
        label="Email"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          setError('');
        }}
        placeholder="Admin email"
        keyboardType="email-address"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          setError('');
        }}
        placeholder="Password"
        secureTextEntry
      />
      <Button
        title="Sign In"
        onPress={handleLogin}
        loading={loading}
        variant="primary"
        style={{ marginTop: 8 }}
      />
    </View>
  );
}
