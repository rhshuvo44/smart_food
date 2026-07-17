import { View, Text, Alert } from 'react-native';
import { Button } from '../../components/common/button';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth.store';
import { logoutUser } from '../../services/auth.service';

export default function ProfileScreen() {
  const { isAuthenticated, user } = useAuthStore();

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logoutUser();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  if (!isAuthenticated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          padding: 24,
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: 16 }}>👤</Text>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 }}>
          Profile
        </Text>
        <Text style={{ fontSize: 16, color: '#6C757D', marginBottom: 32, textAlign: 'center' }}>
          Sign in to manage your account.
        </Text>
        <Button title="Sign In" onPress={() => router.push('/(auth)/login')} variant="primary" />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 24,
      }}
    >
      <View style={{ alignItems: 'center', marginTop: 48, marginBottom: 32 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#FF6B35',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 32, color: '#FFFFFF', fontWeight: '700' }}>
            {user?.firstName?.charAt(0)?.toUpperCase()}
            {user?.lastName?.charAt(0)?.toUpperCase()}
          </Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1A2E' }}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={{ fontSize: 16, color: '#6C757D', marginTop: 4 }}>{user?.email}</Text>
      </View>

      <View
        style={{
          backgroundColor: '#F8F9FA',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <ProfileRow label="Phone" value={user?.phone || 'Not set'} />
        <ProfileRow label="Role" value={user?.role || 'Customer'} />
        <ProfileRow
          label="Member Since"
          value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
        />
      </View>

      <Button
        title="Sign Out"
        onPress={handleLogout}
        variant="ghost"
        style={{ marginTop: 'auto', marginBottom: 24, borderColor: '#DC3545' }}
        textStyle={{ color: '#DC3545' }}
      />
    </View>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
      <Text style={{ fontSize: 16, color: '#6C757D' }}>{label}</Text>
      <Text style={{ fontSize: 16, color: '#1A1A2E', fontWeight: '500' }}>{value}</Text>
    </View>
  );
}
