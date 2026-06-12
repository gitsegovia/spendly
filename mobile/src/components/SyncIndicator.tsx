import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDatabase } from '../contexts/DatabaseContext';

export function SyncIndicator() {
  const { t } = useTranslation();
  const { syncStatus, sync } = useDatabase();

  if (syncStatus === 'idle') return null;

  return (
    <View style={[styles.pill, syncStatus === 'error' && styles.pillError]}>
      {syncStatus === 'syncing' ? (
        <>
          <ActivityIndicator size={12} color="#4F46E5" />
          <Text style={styles.text}>{t('sync.syncing')}</Text>
        </>
      ) : (
        <>
          <Text style={[styles.text, styles.textError]}>{t('sync.error')}</Text>
          <TouchableOpacity onPress={() => sync('manual')}>
            <Text style={styles.retryText}>{t('sync.retry')}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'center',
    backgroundColor: '#EEF2FF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    marginBottom: 6,
  },
  pillError: { backgroundColor: '#FEF2F2' },
  text: { fontSize: 12, color: '#4F46E5', fontWeight: '500' },
  textError: { color: '#EF4444' },
  retryText: { fontSize: 12, color: '#EF4444', fontWeight: '700' },
});
