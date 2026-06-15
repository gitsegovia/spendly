import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { AuthProvider } from '../src/contexts/AuthContext';
import { useAuth } from '../src/contexts/AuthContext';
import { DatabaseProvider } from '../src/contexts/DatabaseContext';
import { NotificationsProvider } from '../src/contexts/NotificationsContext';
import { BiometricProvider, useBiometric } from '../src/contexts/BiometricContext';
import { LockScreen } from '../src/components/LockScreen';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { supabase } from '../src/lib/supabase/client';
import '../src/lib/i18n';

function AuthGate() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    if (!session && !inAuth) {
      router.replace('/(auth)/login');
    } else if (session && !inAuth) {
      if (profile && !profile.onboarding_completed && !inOnboarding) {
        router.replace('/(onboarding)/welcome');
      }
    }
  }, [session, profile, loading, segments]);

  return null;
}

function AppContent() {
  const { isLocked, authenticate } = useBiometric();

  return (
    <View style={styles.root}>
      <StatusBar style="auto" />
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="categories" options={{ animation: 'slide_from_right' }} />
      </Stack>
      {isLocked && (
        <View style={StyleSheet.absoluteFill}>
          <LockScreen onUnlock={authenticate} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default function RootLayout() {
  useEffect(() => {
    const sub = Linking.addEventListener('url', async ({ url }) => {
      console.log('[Linking] url recibida:', url);

      if (url.includes('#access_token=')) {
        WebBrowser.dismissBrowser();
        const hash = url.split('#')[1] ?? '';
        const params: Record<string, string> = {};
        for (const part of hash.split('&')) {
          const [k, v] = part.split('=');
          if (k) params[k] = decodeURIComponent(v ?? '');
        }
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        console.log('[Linking] setSession error:', error?.message ?? 'none');
        return;
      }

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
    <ErrorBoundary>
      <AuthProvider>
        <BiometricProvider>
          <NotificationsProvider>
            <DatabaseProvider>
              <AppContent />
            </DatabaseProvider>
          </NotificationsProvider>
        </BiometricProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
