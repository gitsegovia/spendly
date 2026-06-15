import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>Spendly</Text>
      <Text style={styles.subtitle}>{t('biometric.locked')}</Text>
      <TouchableOpacity style={styles.btn} onPress={onUnlock}>
        <Text style={styles.btnText}>{t('biometric.unlock')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#F9FAFB',
    justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  icon: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6B7280', marginBottom: 16 },
  btn: {
    backgroundColor: '#4F46E5', paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 12,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
