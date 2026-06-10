import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { AuthProvider } from '../src/contexts/AuthContext';
import { supabase } from '../src/lib/supabase/client';
import '../src/lib/i18n';

export default function RootLayout() {
  useEffect(() => {
    // Maneja el deep link de vuelta desde OAuth en Android
    const sub = Linking.addEventListener('url', ({ url }) => {
      const parsed = Linking.parse(url);
      const code = parsed.queryParams?.code as string | undefined;
      if (code) supabase.auth.exchangeCodeForSession(code);
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
