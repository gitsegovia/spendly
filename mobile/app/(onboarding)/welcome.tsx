import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const FEATURES = [
  { icon: '📝', key: 'feature_record' },
  { icon: '📊', key: 'feature_stats' },
  { icon: '🔒', key: 'feature_secure' },
] as const;

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoIcon}>💸</Text>
        </View>
        <Text style={styles.appName}>{t('common.app_name')}</Text>
        <Text style={styles.tagline}>{t('onboarding.tagline')}</Text>
      </View>

      {/* Features */}
      <View style={styles.featuresCard}>
        {FEATURES.map(({ icon, key }, i) => (
          <View
            key={key}
            style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureRowBorder]}
          >
            <View style={styles.featureIconWrap}>
              <Text style={styles.featureIcon}>{icon}</Text>
            </View>
            <Text style={styles.featureText}>{t(`onboarding.${key}`)}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push('/(onboarding)/setup')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>{t('onboarding.start')}</Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>{t('onboarding.free_plan')}</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },

  // Hero
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  logoWrap: {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },
  logoIcon: { fontSize: 48 },
  appName: { fontSize: 38, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  tagline: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24, maxWidth: 260 },

  // Features card
  featuresCard: {
    backgroundColor: '#F9FAFB', borderRadius: 16, padding: 4,
    marginBottom: 32,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  featureRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  featureIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  featureIcon: { fontSize: 20 },
  featureText: { fontSize: 14, color: '#374151', flex: 1, lineHeight: 20, fontWeight: '500' },

  // Footer
  footer: { gap: 12 },
  btn: {
    height: 56, backgroundColor: '#4F46E5', borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  disclaimer: { textAlign: 'center', fontSize: 13, color: '#9CA3AF' },
});
