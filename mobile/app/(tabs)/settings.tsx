import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Switch, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/contexts/AuthContext';
import { useFreemium } from '../../src/hooks/useFreemium';
import { useNotificationsContext } from '../../src/contexts/NotificationsContext';
import { useBiometric } from '../../src/contexts/BiometricContext';
import { AppMessage } from '../../src/components/AppMessage';
import { PaywallModal } from '../../src/components/PaywallModal';
import { supabase } from '../../src/lib/supabase/client';
import { exportTransactionsCsv } from '../../src/lib/exportCsv';
import i18n from '../../src/lib/i18n';

const CURRENCIES = ['USD', 'EUR', 'MXN', 'COP', 'ARS', 'PEN', 'CLP'];
const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, profile, signOut } = useAuth();

  const { isPremium } = useFreemium();
  const { biometricEnabled, biometricAvailable, setBiometricEnabled } = useBiometric();
  const {
    scheduled, hour: savedHour, minute: savedMinute,
    loading: notifLoading, permissionDenied, schedule, cancel,
  } = useNotificationsContext();

  // Estado local de la UI de notificaciones
  const [localEnabled, setLocalEnabled] = useState(false);
  const [localHour, setLocalHour] = useState(20);
  const [localMinute, setLocalMinute] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  // Sincroniza estado local con el contexto cuando carga
  useEffect(() => {
    setLocalEnabled(scheduled);
    setLocalHour(savedHour);
    setLocalMinute(savedMinute);
  }, [scheduled, savedHour, savedMinute]);

  const pendingSave = localEnabled && (!scheduled || localHour !== savedHour || localMinute !== savedMinute);

  async function handleToggleNotif(value: boolean) {
    if (value) {
      setLocalEnabled(true);
    } else {
      setLocalEnabled(false);
      await cancel();
    }
  }

  async function handleSchedule() {
    setScheduling(true);
    try {
      await schedule(localHour, localMinute);
    } catch (e: any) {
      if (e?.message !== 'permission_denied') {
        Alert.alert(t('common.error'), t('notifications.save_error'));
      }
    } finally {
      setScheduling(false);
    }
  }
  const [currency, setCurrency] = useState(profile?.currency ?? 'USD');
  const [language, setLanguage] = useState(profile?.language ?? 'es');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (profile) {
      setCurrency(profile.currency);
      setLanguage(profile.language);
    }
  }, [profile?.currency, profile?.language]);

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ currency, language })
        .eq('id', session.user.id);
      if (error) throw error;
      i18n.changeLanguage(language);
      setMessage({ text: t('settings.saved'), type: 'success' });
    } catch (e: any) {
      setMessage({ text: e.message ?? t('settings.save_error'), type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    if (!isPremium) { setShowPaywall(true); return; }
    try {
      setExporting(true);
      await exportTransactionsCsv(profile?.currency ?? 'USD');
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('settings.export_error'));
    } finally {
      setExporting(false);
    }
  }

  const changed = profile?.currency !== currency || profile?.language !== language;

  return (
    <View style={[styles.outerContainer, { paddingTop: insets.top }]}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.screenTitle}>{t('settings.title')}</Text>

      {/* Cuenta */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('settings.email')}</Text>
          <Text style={styles.rowValue} numberOfLines={1}>{session?.user.email}</Text>
        </View>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/categories')}>
          <Text style={styles.rowLabel}>{t('settings.categories_title')}</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/budget')}>
          <Text style={styles.rowLabel}>{t('budget.nav_row')}</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={styles.rowLabel}>{t('settings.plan')}</Text>
          <View style={[styles.planBadge, profile?.plan === 'premium' ? styles.planPremium : styles.planFree]}>
            <Text style={[styles.planText, profile?.plan === 'premium' ? styles.planTextPremium : styles.planTextFree]}>
              {profile?.plan === 'premium' ? t('settings.plan_premium') : t('settings.plan_free')}
            </Text>
          </View>
        </View>
      </View>

      {/* Preferencias */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>

        {message && (
          <View style={{ marginBottom: 4 }}>
            <AppMessage message={message.text} type={message.type} />
          </View>
        )}

        <Text style={styles.fieldLabel}>{t('settings.currency')}</Text>
        <View style={styles.chips}>
          {CURRENCIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, currency === c && styles.chipSelected]}
              onPress={() => { setCurrency(c); setMessage(null); }}
            >
              <Text style={[styles.chipText, currency === c && styles.chipTextSelected]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>{t('settings.language')}</Text>
        <View style={styles.chips}>
          {LANGUAGES.map((l) => (
            <TouchableOpacity
              key={l.code}
              style={[styles.chip, language === l.code && styles.chipSelected]}
              onPress={() => { setLanguage(l.code); setMessage(null); }}
            >
              <Text style={[styles.chipText, language === l.code && styles.chipTextSelected]}>
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, (!changed || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!changed || saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>{t('settings.save_preferences')}</Text>}
        </TouchableOpacity>
      </View>

      {/* Notificaciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notifications.title')}</Text>

        <View style={[styles.row, { borderBottomWidth: localEnabled ? 1 : 0 }]}>
          <Text style={styles.rowLabel}>{t('notifications.reminder')}</Text>
          {notifLoading ? (
            <ActivityIndicator size="small" color="#4F46E5" />
          ) : (
            <Switch
              value={localEnabled}
              onValueChange={handleToggleNotif}
              trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
              thumbColor={localEnabled ? '#4F46E5' : '#9CA3AF'}
            />
          )}
        </View>

        {localEnabled && (
          <>
            <TouchableOpacity
              style={[styles.row, { borderBottomWidth: 0 }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.rowLabel}>{t('notifications.reminder_time')}</Text>
              <Text style={styles.rowValue}>
                {String(localHour).padStart(2, '0')}:{String(localMinute).padStart(2, '0')}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                value={(() => { const d = new Date(); d.setHours(localHour, localMinute, 0, 0); return d; })()}
                onValueChange={(date?: Date) => {
                  if (date) { setLocalHour(date.getHours()); setLocalMinute(date.getMinutes()); }
                }}
                onDismiss={() => setShowTimePicker(false)}
              />
            )}

            {pendingSave && (
              <TouchableOpacity
                style={[styles.scheduleBtn, scheduling && styles.saveBtnDisabled]}
                onPress={handleSchedule}
                disabled={scheduling}
              >
                {scheduling
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.scheduleBtnText}>
                      {scheduled ? t('notifications.update_btn') : t('notifications.schedule_btn')}
                    </Text>
                }
              </TouchableOpacity>
            )}

            {scheduled && !pendingSave && (
              <Text style={styles.activeText}>
                {t('notifications.active_at')} {String(savedHour).padStart(2, '0')}:{String(savedMinute).padStart(2, '0')}
              </Text>
            )}
          </>
        )}

        {permissionDenied && (
          <Text style={styles.permissionDenied}>{t('notifications.permission_denied')}</Text>
        )}
      </View>

      {/* Seguridad */}
      {biometricAvailable && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.security')}</Text>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>{t('settings.biometric_lock')}</Text>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
              thumbColor={biometricEnabled ? '#4F46E5' : '#9CA3AF'}
            />
          </View>
        </View>
      )}

      {/* Exportar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.export_title')}</Text>
        <TouchableOpacity
          style={[styles.exportBtn, !isPremium && styles.exportBtnLocked]}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color={isPremium ? '#fff' : '#9CA3AF'} />
          ) : (
            <View style={styles.exportRow}>
              {!isPremium && <Text style={styles.exportLock}>🔒 </Text>}
              <Text style={[styles.exportBtnText, !isPremium && styles.exportBtnTextLocked]}>
                {t('settings.export_csv')}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.exportHint}>{t('settings.export_csv_hint')}</Text>
      </View>

      {/* Sesión */}
      <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
        <Text style={styles.signOutText}>{t('auth.sign_out')}</Text>
      </TouchableOpacity>

      <View style={{ height: 24 }} />
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 12 },
  screenTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 16 },

  section: {
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16,
    paddingTop: 16, paddingBottom: 8, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#9CA3AF',
    marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.6,
  },

  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  rowLabel: { fontSize: 15, color: '#374151' },
  rowValue: { fontSize: 15, color: '#9CA3AF', maxWidth: '60%' },
  rowChevron: { fontSize: 20, color: '#9CA3AF' },

  planBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  planFree: { backgroundColor: '#F3F4F6' },
  planPremium: { backgroundColor: '#FEF3C7' },
  planText: { fontSize: 13, fontWeight: '600' },
  planTextFree: { color: '#6B7280' },
  planTextPremium: { color: '#D97706' },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  chipSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  chipText: { fontSize: 14, color: '#6B7280' },
  chipTextSelected: { color: '#4F46E5', fontWeight: '600' },

  saveBtn: {
    height: 46, backgroundColor: '#4F46E5', borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginTop: 16, marginBottom: 8,
  },
  saveBtnDisabled: { backgroundColor: '#C7D2FE' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  exportBtn: {
    height: 46, backgroundColor: '#4F46E5', borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  exportBtnLocked: { backgroundColor: '#F3F4F6' },
  exportRow: { flexDirection: 'row', alignItems: 'center' },
  exportLock: { fontSize: 14 },
  exportBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  exportBtnTextLocked: { color: '#9CA3AF' },
  exportHint: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', paddingBottom: 8 },

  scheduleBtn: {
    height: 42, backgroundColor: '#4F46E5', borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 8,
  },
  scheduleBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  activeText: {
    fontSize: 12, color: '#10B981', paddingHorizontal: 4,
    paddingBottom: 10, paddingTop: 4, fontWeight: '500',
  },
  permissionDenied: {
    fontSize: 12, color: '#EF4444', paddingHorizontal: 4, paddingBottom: 10, lineHeight: 18,
  },

  signOutBtn: {
    height: 50, backgroundColor: '#fff', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FEE2E2',
  },
  signOutText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});
