import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../src/contexts/AuthContext';

const TIMEOUT_MS = 12000;

export default function Index() {
  const { t } = useTranslation();
  const { session, profile, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading && !timedOut) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (timedOut && loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('common.connection_error')}</Text>
        <Text style={styles.hint}>{t('common.connection_error_hint')}</Text>
        <TouchableOpacity onPress={() => setTimedOut(false)} style={styles.retry}>
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!profile || !profile.onboarding_completed) return <Redirect href="/(onboarding)/welcome" />;
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', gap: 12 },
  errorText: { fontSize: 16, color: '#374151', fontWeight: '600' },
  hint: { fontSize: 14, color: '#9CA3AF' },
  retry: { marginTop: 8, backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  retryText: { color: '#fff', fontWeight: '600' },
});
