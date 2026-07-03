import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../src/contexts/AuthContext';
import { useBiometric } from '../src/contexts/BiometricContext';
import { useOverallBalance } from '../src/hooks/useOverallBalance';
import { AppMessage } from '../src/components/AppMessage';
import { PaywallModal } from '../src/components/PaywallModal';
import { supabase } from '../src/lib/supabase/client';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, profile, signOut } = useAuth();
  const { biometricEnabled, biometricAvailable, setBiometricEnabled } = useBiometric();
  const { balance, available, totalSavings, loading: balanceLoading } = useOverallBalance();

  const [showPaywall, setShowPaywall] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const email = session?.user.email ?? '';
  const initials = email.slice(0, 2).toUpperCase();
  const currency = profile?.currency ?? 'USD';
  const isPremium = profile?.plan === 'premium';

  // Cambio de contraseña solo aplica a cuentas email/password (no OAuth)
  const providers: string[] = (session?.user.app_metadata?.providers as string[])
    ?? [session?.user.app_metadata?.provider].filter(Boolean) as string[];
  const hasEmailProvider = providers.includes('email');

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(
        profile.language === 'en' ? 'en-US' : 'es-ES',
        { month: 'long', year: 'numeric' },
      )
    : '';

  async function handleChangePassword() {
    setPasswordMsg(null);
    if (newPassword.length < 6) {
      setPasswordMsg({ text: t('profile.password_too_short'), type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: t('profile.password_mismatch'), type: 'error' });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ text: t('profile.password_updated'), type: 'success' });
    } catch (e: any) {
      setPasswordMsg({ text: e.message ?? t('common.error'), type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <View style={[styles.outer, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.back}>‹ {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('profile.title')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Identidad */}
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.email} numberOfLines={1}>{email}</Text>
          {memberSince ? (
            <Text style={styles.memberSince}>{t('profile.member_since')} {memberSince}</Text>
          ) : null}
          <View style={styles.planRow}>
            <View style={[styles.planBadge, isPremium ? styles.planPremium : styles.planFree]}>
              <Text style={[styles.planText, isPremium ? styles.planTextPremium : styles.planTextFree]}>
                {isPremium ? t('settings.plan_premium') : t('settings.plan_free')}
              </Text>
            </View>
            {!isPremium && (
              <TouchableOpacity style={styles.upgradeBtn} onPress={() => setShowPaywall(true)}>
                <Text style={styles.upgradeBtnText}>{t('settings.upgrade')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Balance general */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.overall_balance')}</Text>
          {balanceLoading ? (
            <ActivityIndicator color="#4F46E5" style={{ marginVertical: 12 }} />
          ) : (
            <>
              <Text
                style={[styles.balanceAmount, { color: balance >= 0 ? '#111827' : '#EF4444' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {balance >= 0 ? '' : '-'}{currency} {Math.abs(balance).toFixed(2)}
              </Text>
              <View style={styles.balancePills}>
                <View style={styles.balancePill}>
                  <Text style={styles.balancePillLabel}>{t('profile.available')}</Text>
                  <Text style={[styles.balancePillAmount, { color: available >= 0 ? '#10B981' : '#EF4444' }]}>
                    {currency} {available.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.balancePillDivider} />
                <View style={styles.balancePill}>
                  <Text style={styles.balancePillLabel}>{t('savings.total_saved')}</Text>
                  <Text style={[styles.balancePillAmount, { color: '#0EA5E9' }]}>
                    {currency} {totalSavings.toFixed(2)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Seguridad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.security')}</Text>

          {biometricAvailable && (
            <View style={[styles.row, !hasEmailProvider && { borderBottomWidth: 0 }]}>
              <Text style={styles.rowLabel}>{t('settings.biometric_lock')}</Text>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
                thumbColor={biometricEnabled ? '#4F46E5' : '#9CA3AF'}
              />
            </View>
          )}

          {hasEmailProvider && (
            <View style={styles.passwordBlock}>
              <Text style={styles.fieldLabel}>{t('profile.change_password')}</Text>
              {passwordMsg && (
                <View style={{ marginBottom: 8 }}>
                  <AppMessage message={passwordMsg.text} type={passwordMsg.type} />
                </View>
              )}
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={(v) => { setNewPassword(v); setPasswordMsg(null); }}
                placeholder={t('profile.new_password')}
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setPasswordMsg(null); }}
                placeholder={t('profile.confirm_password')}
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  (changingPassword || !newPassword || !confirmPassword) && styles.saveBtnDisabled,
                ]}
                onPress={handleChangePassword}
                disabled={changingPassword || !newPassword || !confirmPassword}
              >
                {changingPassword
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>{t('profile.update_password')}</Text>}
              </TouchableOpacity>
            </View>
          )}

          {!hasEmailProvider && (
            <Text style={styles.oauthNote}>{t('profile.oauth_account')}</Text>
          )}
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <Text style={styles.signOutText}>{t('auth.sign_out')}</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  back: { fontSize: 16, color: '#4F46E5', fontWeight: '500', width: 60 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },

  content: { paddingHorizontal: 20, paddingBottom: 20 },

  identityCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, marginTop: 4,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 4,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#4F46E5' },
  email: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  memberSince: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  planFree: { backgroundColor: '#F3F4F6' },
  planPremium: { backgroundColor: '#FEF3C7' },
  planText: { fontSize: 12, fontWeight: '700' },
  planTextFree: { color: '#6B7280' },
  planTextPremium: { color: '#D97706' },
  upgradeBtn: {
    backgroundColor: '#4F46E5', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  upgradeBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  section: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#9CA3AF',
    marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.6,
  },

  balanceAmount: {
    fontSize: 30, fontWeight: '800', letterSpacing: -0.5,
    textAlign: 'center', marginBottom: 14,
  },
  balancePills: {
    flexDirection: 'row', width: '100%',
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14,
  },
  balancePill: { flex: 1, alignItems: 'center', gap: 3 },
  balancePillLabel: { fontSize: 11, color: '#9CA3AF' },
  balancePillAmount: { fontSize: 15, fontWeight: '700' },
  balancePillDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 8 },

  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  rowLabel: { fontSize: 15, color: '#374151' },

  passwordBlock: { paddingTop: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 10 },
  input: {
    height: 46, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 14, fontSize: 15, color: '#111827', marginBottom: 10,
  },
  saveBtn: {
    height: 46, backgroundColor: '#4F46E5', borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  saveBtnDisabled: { backgroundColor: '#C7D2FE' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  oauthNote: { fontSize: 12, color: '#9CA3AF', paddingVertical: 4 },

  signOutBtn: {
    height: 50, backgroundColor: '#fff', borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginTop: 12,
    borderWidth: 1.5, borderColor: '#FEE2E2',
  },
  signOutText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});
