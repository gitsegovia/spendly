import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/contexts/AuthContext';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('dashboard.title')}</Text>
      <Text style={styles.subtitle}>Sprint 2 — en construcción</Text>
      <TouchableOpacity style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>{t('auth.sign_out')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  signOut: {
    marginTop: 32,
    padding: 12,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 14,
  },
});
