import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const features = [
    { icon: '📊', text: t('onboarding.feature_record') },
    { icon: '📈', text: t('onboarding.feature_stats') },
    { icon: '🔒', text: t('onboarding.feature_secure') },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.hero}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>💸</Text>
        </View>
        <Text style={styles.appName}>{t('common.app_name')}</Text>
        <Text style={styles.tagline}>{t('onboarding.tagline')}</Text>
      </View>

      <View style={styles.features}>
        {features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/(onboarding)/setup')}>
          <Text style={styles.btnText}>{t('onboarding.start')}</Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>{t('onboarding.free_plan')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#fff',
    paddingHorizontal: 32, justifyContent: 'space-between',
  },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  logoContainer: {
    width: 88, height: 88, borderRadius: 24,
    backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  logoIcon: { fontSize: 44 },
  appName: { fontSize: 36, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  tagline: { fontSize: 17, color: '#6B7280', textAlign: 'center', lineHeight: 24 },

  features: { gap: 16, marginBottom: 40 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: { fontSize: 24, width: 32, textAlign: 'center' },
  featureText: { fontSize: 15, color: '#374151', flex: 1, lineHeight: 22 },

  footer: { gap: 12 },
  btn: {
    height: 54, backgroundColor: '#4F46E5', borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  disclaimer: { textAlign: 'center', fontSize: 13, color: '#9CA3AF' },
});
