import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';

export default function Index() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!profile) return <Redirect href="/(onboarding)/setup" />;
  return <Redirect href="/(tabs)" />;
}
