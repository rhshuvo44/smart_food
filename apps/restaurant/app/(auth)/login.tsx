import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { router } from 'expo-router';
import { useState } from 'react';
import { loginUser } from '../../services/auth.service';
import { useAuthStore } from '../../stores/auth.store';
import { isValidEmail, isValidPassword, isEmpty } from '../../utils/validation';

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
    else if (!isValidPassword(password))
      newErrors.password = 'Min 8 characters, 1 uppercase, 1 number';
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
      const message =
        err?.response?.data?.error?.message || err?.message || 'Login failed. Please try again.';
      Alert.alert('Login Failed', message);
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
          <Text style={styles.title}>Restaurant Portal</Text>
          <Text style={styles.subtitle}>Sign in to manage your restaurant</Text>
        </View>

        <Input
          label="Email"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
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
            if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
          }}
          placeholder="Enter your password"
          secureTextEntry
          error={errors.password}
        />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/forgot-password')}
          style={styles.forgotLink}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <Button
          title="Sign In"
          onPress={handleLogin}
          variant="secondary"
          loading={loading}
          style={styles.signInBtn}
        />

        <Button
          title="Register your restaurant"
          onPress={() => router.push('/(auth)/register')}
          variant="ghost"
          style={styles.registerBtn}
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
  forgotLink: { alignSelf: 'flex-end', marginBottom: 16 },
  forgotText: { color: '#004E89', fontSize: 14, fontWeight: '500' },
  signInBtn: { marginTop: 8 },
  registerBtn: { marginTop: 16 },
});
