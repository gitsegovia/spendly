import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/contexts/AuthContext';
import '../src/lib/i18n';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
