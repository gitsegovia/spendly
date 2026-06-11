import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { AuthProvider } from '../src/contexts/AuthContext';
import { supabase } from '../src/lib/supabase/client';
import '../src/lib/i18n';

export default function RootLayout() {
  useEffect(() => {
    // Captura el deep link de OAuth (exp:// en Expo Go, spendly:// en dev build)
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
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
