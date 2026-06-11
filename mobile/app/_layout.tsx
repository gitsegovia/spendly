import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { AuthProvider } from '../src/contexts/AuthContext';
import { useAuth } from '../src/contexts/AuthContext';
import { supabase } from '../src/lib/supabase/client';
import '../src/lib/i18n';

// Redirige globalmente según el estado de auth, desde cualquier pantalla.
function AuthGate() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    if (!session && !inAuth) {
      // Sin sesión fuera del grupo auth → login
      router.replace('/(auth)/login');
    } else if (session && !inAuth) {
      // Con sesión: chequear onboarding
      if (profile && !profile.onboarding_completed && !inOnboarding) {
        router.replace('/(onboarding)/welcome');
      }
    }
  }, [session, profile, loading, segments]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    const sub = Linking.addEventListener('url', async ({ url }) => {
      console.log('[Linking] url recibida:', url);
      const parsed = Linking.parse(url);
      const code = parsed.queryParams?.code as string | undefined;
      if (code) {
        WebBrowser.dismissBrowser();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        console.log('[Linking] exchangeCode error:', error?.message ?? 'none');
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
