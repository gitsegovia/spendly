import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { purchases } from '../lib/purchases';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const BENEFITS = [
  'premium.history_benefit',
  'premium.export_benefit',
  'premium.support_benefit',
] as const;

type Status = 'idle' | 'processing' | 'success';

export function PaywallModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const { session, refreshProfile } = useAuth();
  const [status, setStatus] = useState<Status>('idle');
  const [errorKey, setErrorKey] = useState<string | null>(null);

  function handleClose() {
    if (status === 'processing') return;
    setStatus('idle');
    setErrorKey(null);
    onClose();
  }

  async function handleUpgrade() {
    if (!session || status === 'processing') return;
    setStatus('processing');
    setErrorKey(null);
    const result = await purchases.purchasePremium(session.user.id);
    if (result.success) {
      await refreshProfile();
      setStatus('success');
    } else {
      setStatus('idle');
      setErrorKey(result.errorKey ?? 'premium.purchase_error');
    }
  }

  async function handleRestore() {
    if (!session || status === 'processing') return;
    setStatus('processing');
    setErrorKey(null);
    const result = await purchases.restorePurchases(session.user.id);
    if (result.success) {
      await refreshProfile();
      setStatus('success');
    } else {
      setStatus('idle');
      setErrorKey(result.errorKey ?? 'premium.purchase_error');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {status === 'success' ? (
            <>
              <View style={[styles.lockBadge, styles.successBadge]}>
                <Text style={styles.lockIcon}>🎉</Text>
              </View>
              <Text style={styles.title}>{t('premium.success_title')}</Text>
              <Text style={styles.subtitle}>{t('premium.success_message')}</Text>
              <TouchableOpacity style={styles.upgradeButton} onPress={handleClose}>
                <Text style={styles.upgradeText}>{t('premium.continue')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.lockBadge}>
                <Text style={styles.lockIcon}>🔒</Text>
              </View>

              <Text style={styles.title}>{t('premium.title')}</Text>
              <Text style={styles.subtitle}>{t('premium.history_locked')}</Text>

              <View style={styles.benefits}>
                {BENEFITS.map((key) => (
                  <View key={key} style={styles.benefitRow}>
                    <Text style={styles.check}>✓</Text>
                    <Text style={styles.benefitText}>{t(key)}</Text>
                  </View>
                ))}
              </View>

              {errorKey && <Text style={styles.errorText}>{t(errorKey)}</Text>}

              <TouchableOpacity
                style={[styles.upgradeButton, status === 'processing' && styles.upgradeButtonDisabled]}
                onPress={handleUpgrade}
                disabled={status === 'processing'}
              >
                {status === 'processing' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.upgradeText}>{t('premium.upgrade')}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleRestore} disabled={status === 'processing'}>
                <Text style={styles.restoreText}>{t('premium.restore')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.laterButton} onPress={handleClose} disabled={status === 'processing'}>
                <Text style={styles.laterText}>{t('premium.maybe_later')}</Text>
              </TouchableOpacity>

              {purchases.isSimulated && (
                <Text style={styles.simulatedNotice}>{t('premium.simulated_notice')}</Text>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 40,
    alignItems: 'center',
  },
  lockBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successBadge: { backgroundColor: '#F0FDF4' },
  lockIcon: { fontSize: 28 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  benefits: {
    width: '100%',
    gap: 12,
    marginBottom: 28,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  check: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '700',
    width: 20,
  },
  benefitText: {
    fontSize: 15,
    color: '#374151',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButtonDisabled: { backgroundColor: '#C7D2FE' },
  upgradeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  restoreText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
    paddingVertical: 8,
  },
  laterButton: {
    paddingVertical: 8,
  },
  laterText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  simulatedNotice: {
    fontSize: 11,
    color: '#D1D5DB',
    marginTop: 8,
  },
});
