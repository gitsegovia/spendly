import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { AppMessage } from '../../src/components/AppMessage';
import { supabase } from '../../src/lib/supabase/client';
import i18n from '../../src/lib/i18n';

const CURRENCIES = ['USD', 'EUR', 'MXN', 'COP', 'ARS', 'PEN', 'CLP'];
const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { session, profile, signOut } = useAuth();

  const [currency, setCurrency] = useState(profile?.currency ?? 'USD');
  const [language, setLanguage] = useState(profile?.language ?? 'es');
  const [saving, setSaving] = useState(false);
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
      setMessage({ text: 'Preferencias guardadas', type: 'success' });
    } catch (e: any) {
      setMessage({ text: e.message ?? 'Error al guardar', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  const changed = profile?.currency !== currency || profile?.language !== language;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
    >
      <Text style={styles.screenTitle}>Ajustes</Text>

      {/* Cuenta */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuenta</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Email</Text>
          <Text style={styles.rowValue} numberOfLines={1}>{session?.user.email}</Text>
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={styles.rowLabel}>Plan</Text>
          <View style={[styles.planBadge, profile?.plan === 'premium' ? styles.planPremium : styles.planFree]}>
            <Text style={[styles.planText, profile?.plan === 'premium' ? styles.planTextPremium : styles.planTextFree]}>
              {profile?.plan === 'premium' ? 'Premium' : 'Free'}
            </Text>
          </View>
        </View>
      </View>

      {/* Preferencias */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferencias</Text>

        {message && (
          <View style={{ marginBottom: 4 }}>
            <AppMessage message={message.text} type={message.type} />
          </View>
        )}

        <Text style={styles.fieldLabel}>Moneda</Text>
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

        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Idioma</Text>
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
            : <Text style={styles.saveBtnText}>Guardar preferencias</Text>}
        </TouchableOpacity>
      </View>

      {/* Sesión */}
      <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
        <Text style={styles.signOutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
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

  signOutBtn: {
    height: 50, backgroundColor: '#fff', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FEE2E2',
  },
  signOutText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});
