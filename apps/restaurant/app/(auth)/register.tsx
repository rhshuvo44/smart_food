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
import { registerUser } from '../../services/auth.service';
import { useAuthStore } from '../../stores/auth.store';
import { isValidEmail, isValidPassword, isValidPhone, isEmpty } from '../../utils/validation';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setAuth = useAuthStore((s) => s.setAuth);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (isEmpty(firstName)) newErrors.firstName = 'First name is required';
    if (isEmpty(lastName)) newErrors.lastName = 'Last name is required';
    if (isEmpty(email)) newErrors.email = 'Email is required';
    else if (!isValidEmail(email)) newErrors.email = 'Please enter a valid email';
    if (isEmpty(phone)) newErrors.phone = 'Phone number is required';
    else if (!isValidPhone(phone)) newErrors.phone = 'Please enter a valid phone number';
    if (isEmpty(password)) newErrors.password = 'Password is required';
    else if (!isValidPassword(password))
      newErrors.password = 'Min 8 characters, 1 uppercase, 1 number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await registerUser({ firstName, lastName, email, phone, password });
      setAuth(result.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Registration failed. Please try again.';
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: string) => {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Register Restaurant</Text>
          <Text style={styles.subtitle}>Create your restaurant owner account</Text>
        </View>

        <Input
          label="First Name"
          value={firstName}
          onChangeText={(t) => {
            setFirstName(t);
            clearError('firstName');
          }}
          placeholder="Enter your first name"
          error={errors.firstName}
        />

        <Input
          label="Last Name"
          value={lastName}
          onChangeText={(t) => {
            setLastName(t);
            clearError('lastName');
          }}
          placeholder="Enter your last name"
          error={errors.lastName}
        />

        <Input
          label="Email"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            clearError('email');
          }}
          placeholder="Enter your email"
          keyboardType="email-address"
          error={errors.email}
        />

        <Input
          label="Phone Number"
          value={phone}
          onChangeText={(t) => {
            setPhone(t);
            clearError('phone');
          }}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          error={errors.phone}
        />

        <Input
          label="Password"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            clearError('password');
          }}
          placeholder="Create a password (min 8 chars, 1 uppercase, 1 number)"
          secureTextEntry
          error={errors.password}
        />

        <Button
          title="Register"
          onPress={handleRegister}
          variant="secondary"
          loading={loading}
          style={styles.registerBtn}
        />

        <Button
          title="Already have an account? Sign In"
          onPress={() => router.push('/(auth)/login')}
          variant="ghost"
          style={styles.signInBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A2E', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6C757D', textAlign: 'center', marginTop: 8 },
  registerBtn: { marginTop: 8 },
  signInBtn: { marginTop: 16 },
});
