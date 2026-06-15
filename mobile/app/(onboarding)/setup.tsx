import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import i18n from '../../src/lib/i18n';
import { supabase } from '../../src/lib/supabase/client';
import { useAuth } from '../../src/contexts/AuthContext';
import { AppMessage } from '../../src/components/AppMessage';

const CURRENCIES = ['USD', 'EUR', 'MXN', 'COP', 'ARS', 'PEN', 'CLP'];
const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

export default function SetupScreen() {
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('es');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleFinish() {
    if (!user) return;
    setErrorMsg('');
    try {
      setLoading(true);
      await supabase
        .from('profiles')
        .update({ currency, language, onboarding_completed: true })
        .eq('id', user.id);

      const { count } = await supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (!count || count === 0) {
        await supabase.rpc('seed_default_categories', { p_user_id: user.id });
      }

      await refreshProfile();
      i18n.changeLanguage(language);
      router.replace('/(tabs)');
    } catch (e: any) {
      setErrorMsg(e.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>2 / 2</Text>
          </View>
          <Text style={styles.title}>{t('onboarding.setup_title')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.setup_subtitle')}</Text>
        </View>

        {errorMsg ? (
          <View style={styles.errorWrap}>
            <AppMessage message={errorMsg} type="error" />
          </View>
        ) : null}

        {/* Currency */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.currency')}</Text>
          <View style={styles.chips}>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, currency === c && styles.chipSelected]}
                onPress={() => setCurrency(c)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, currency === c && styles.chipTextSelected]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
          <View style={styles.chips}>
            {LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.code}
                style={[styles.chip, language === l.code && styles.chipSelected]}
                onPress={() => setLanguage(l.code)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, language === l.code && styles.chipTextSelected]}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleFinish}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{t('onboarding.finish')}</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 28 },

  header: { marginBottom: 32 },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4, marginBottom: 16,
  },
  stepText: { fontSize: 12, fontWeight: '700', color: '#4F46E5' },
  title: { fontSize: 30, fontWeight: '800', color: '#111827', marginBottom: 6, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, color: '#6B7280', lineHeight: 22 },

  errorWrap: { marginBottom: 16 },

  section: { marginBottom: 28 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  chipSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  chipText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  chipTextSelected: { color: '#4F46E5', fontWeight: '700' },

  btn: {
    height: 56, backgroundColor: '#4F46E5', borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  btnDisabled: { backgroundColor: '#C7D2FE', shadowOpacity: 0 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
});
