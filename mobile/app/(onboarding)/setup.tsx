import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from '../../src/lib/i18n';
import { supabase } from '../../src/lib/supabase/client';
import { useAuth } from '../../src/contexts/AuthContext';

const CURRENCIES = ['USD', 'EUR', 'MXN', 'COP', 'ARS', 'PEN', 'CLP'];
const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

export default function SetupScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('es');
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    if (!user) return;
    try {
      setLoading(true);

      await supabase
        .from('profiles')
        .update({ currency, language })
        .eq('id', user.id);

      await supabase.rpc('seed_default_categories', { p_user_id: user.id });

      i18n.changeLanguage(language);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Casi listo!</Text>
      <Text style={styles.subtitle}>Configurá tu moneda e idioma</Text>

      <Text style={styles.sectionLabel}>Moneda</Text>
      <View style={styles.options}>
        {CURRENCIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, currency === c && styles.chipSelected]}
            onPress={() => setCurrency(c)}
          >
            <Text style={[styles.chipText, currency === c && styles.chipTextSelected]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Idioma</Text>
      <View style={styles.options}>
        {LANGUAGES.map((l) => (
          <TouchableOpacity
            key={l.code}
            style={[styles.chip, language === l.code && styles.chipSelected]}
            onPress={() => setLanguage(l.code)}
          >
            <Text style={[styles.chipText, language === l.code && styles.chipTextSelected]}>
              {l.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleFinish} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Comenzar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 32,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 8,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  chipText: {
    fontSize: 14,
    color: '#6B7280',
  },
  chipTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  button: {
    height: 52,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
