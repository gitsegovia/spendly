import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';

export default function AuthLayout() {
  const { session, loading } = useAuth();

  // Cuando el OAuth callback actualiza la sesión, salir del flujo de auth
  if (!loading && session) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
