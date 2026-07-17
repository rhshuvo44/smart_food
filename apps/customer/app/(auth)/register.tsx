import { useState } from 'react';
import { Text, ScrollView, Alert } from 'react-native';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { router } from 'expo-router';
import { registerUser } from '../../services/auth.service';
import { isValidEmail, isValidPhone, isValidPassword, isEmpty } from '../../utils/validation';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (isEmpty(firstName)) newErrors.firstName = 'First name is required';
    if (isEmpty(lastName)) newErrors.lastName = 'Last name is required';
    if (isEmpty(email)) newErrors.email = 'Email is required';
    else if (!isValidEmail(email)) newErrors.email = 'Invalid email format';
    if (phone && !isValidPhone(phone)) newErrors.phone = 'Invalid phone number';
    if (isEmpty(password)) newErrors.password = 'Password is required';
    else if (!isValidPassword(password))
      newErrors.password = 'Must be 8+ chars with uppercase, lowercase, and number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      await registerUser({ firstName, lastName, email, phone: phone || undefined, password });
      router.replace('/(tabs)');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
      const message =
        axiosError?.response?.data?.error?.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      contentContainerStyle={{ padding: 24, justifyContent: 'center', flexGrow: 1 }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: '700',
          color: '#1A1A2E',
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        Create Account
      </Text>
      <Text style={{ fontSize: 16, color: '#6C757D', marginBottom: 32, textAlign: 'center' }}>
        Join SmartFood today
      </Text>

      <Input
        label="First Name"
        value={firstName}
        onChangeText={(t) => {
          setFirstName(t);
          setErrors((e) => ({ ...e, firstName: undefined }));
        }}
        placeholder="Enter your first name"
        error={errors.firstName}
      />
      <Input
        label="Last Name"
        value={lastName}
        onChangeText={(t) => {
          setLastName(t);
          setErrors((e) => ({ ...e, lastName: undefined }));
        }}
        placeholder="Enter your last name"
        error={errors.lastName}
      />
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
        label="Phone"
        value={phone}
        onChangeText={(t) => {
          setPhone(t);
          setErrors((e) => ({ ...e, phone: undefined }));
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
          setErrors((e) => ({ ...e, password: undefined }));
        }}
        placeholder="Create a password"
        secureTextEntry
        error={errors.password}
      />

      <Button
        title="Create Account"
        onPress={handleRegister}
        variant="primary"
        loading={loading}
        style={{ marginTop: 8 }}
      />

      <Button
        title="Already have an account? Sign In"
        onPress={() => router.back()}
        variant="ghost"
        style={{ marginTop: 16 }}
      />
    </ScrollView>
  );
}
