import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { router } from 'expo-router';
import { useState } from 'react';
import { registerUser } from '../../services/auth.service';
import { useAuthStore } from '../../stores/auth.store';
import { isValidEmail, isValidPassword, isValidPhone, isEmpty } from '../../utils/validation';
import { colors, spacing, typography } from '../../constants';

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
    else if (!isValidPassword(password)) newErrors.password = 'Min 8 characters, 1 uppercase, 1 number';
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
      setErrors({ email: err?.response?.data?.error?.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: string) => {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🍽️</Text>
          </View>
          <Text style={styles.title}>Register Restaurant</Text>
          <Text style={styles.subtitle}>Create your restaurant owner account</Text>
        </View>

        <Input label="First Name" value={firstName} onChangeText={(t) => { setFirstName(t); clearError('firstName'); }} placeholder="Enter your first name" error={errors.firstName} />
        <Input label="Last Name" value={lastName} onChangeText={(t) => { setLastName(t); clearError('lastName'); }} placeholder="Enter your last name" error={errors.lastName} />
        <Input label="Email" value={email} onChangeText={(t) => { setEmail(t); clearError('email'); }} placeholder="Enter your email" keyboardType="email-address" error={errors.email} />
        <Input label="Phone Number" value={phone} onChangeText={(t) => { setPhone(t); clearError('phone'); }} placeholder="Enter your phone number" keyboardType="phone-pad" error={errors.phone} />
        <Input label="Password" value={password} onChangeText={(t) => { setPassword(t); clearError('password'); }} placeholder="Create a password" secureTextEntry error={errors.password} />

        <Button title="Register" onPress={handleRegister} variant="secondary" loading={loading} style={styles.registerBtn} />
        <Button title="Already have an account? Sign In" onPress={() => router.push('/(auth)/login')} variant="ghost" style={styles.signInBtn} />
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
  registerBtn: { marginTop: 8 },
  signInBtn: { marginTop: 16 },
});
