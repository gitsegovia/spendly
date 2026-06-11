import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase/client';

export default function AuthCallback() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();

  useEffect(() => {
    if (!code) {
      router.replace('/(auth)/login');
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) router.replace('/(auth)/login');
      // AuthContext detecta el cambio de sesión y redirige automáticamente
    });
  }, [code]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
