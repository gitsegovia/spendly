import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Q } from '@nozbe/watermelondb';
import { database } from '../src/lib/watermelondb/database';
import CategoryModel from '../src/lib/watermelondb/models/Category';
import { useBudgets } from '../src/hooks/useBudgets';
import { useMonthlyStats } from '../src/hooks/useMonthlyStats';
import { useAuth } from '../src/contexts/AuthContext';
import { categoryLabel } from '../src/lib/categoryName';

interface CategoryWithBudget {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget: number | null;
  spent: number;
}

export default function BudgetScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, session } = useAuth();
  const { budgets, loading: budgetLoading, setBudget, deleteBudget, getBudgetForCategory } = useBudgets();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const { stats } = useMonthlyStats(year, month);

  const [expenseCategories, setExpenseCategories] = useState<CategoryModel[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCat, setSelectedCat] = useState<CategoryModel | null>(null);
  const [inputAmount, setInputAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const currency = profile?.currency ?? 'USD';

  useEffect(() => {
    database.collections
      .get<CategoryModel>('categories')
      .query(Q.where('is_deleted', false), Q.where('type', 'expense'))
      .fetch()
      .then((cats) => {
        setExpenseCategories(cats.sort((a, b) => a.name.localeCompare(b.name)));
        setLoadingCats(false);
      });
  }, []);

  const spentByCat = useCallback(
    (catId: string) => stats.expensesByCategory.find((e) => e.category_id === catId)?.total ?? 0,
    [stats.expensesByCategory],
  );

  function openModal(cat: CategoryModel) {
    const existing = getBudgetForCategory(cat.id);
    setSelectedCat(cat);
    setInputAmount(existing !== null ? String(existing) : '');
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setSelectedCat(null);
    setInputAmount('');
  }

  async function handleSave() {
    if (!selectedCat || !session) return;
    const amount = parseFloat(inputAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t('common.error'), t('budget.invalid_amount'));
      return;
    }
    setSaving(true);
    try {
      await setBudget(selectedCat.id, amount, session.user.id);
      closeModal();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!selectedCat) return;
    setSaving(true);
    try {
      await deleteBudget(selectedCat.id);
      closeModal();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  const loading = loadingCats || budgetLoading;

  return (
    <View style={[styles.outer, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.back}>‹ {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('budget.title')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={styles.subtitle}>{t('budget.subtitle')}</Text>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#4F46E5" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {expenseCategories.map((cat) => {
            const budget = getBudgetForCategory(cat.id);
            const spent = spentByCat(cat.id);
            const pct = budget && budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
            const over = budget !== null && spent > budget;
            const barColor = over ? '#EF4444' : '#4F46E5';

            return (
              <TouchableOpacity key={cat.id} style={styles.row} onPress={() => openModal(cat)}>
                <View style={styles.rowLeft}>
                  {cat.icon ? (
                    <Text style={styles.icon}>{cat.icon}</Text>
                  ) : (
                    <View style={[styles.dot, { backgroundColor: cat.color }]} />
                  )}
                  <View style={styles.rowInfo}>
                    <Text style={styles.catName} numberOfLines={1}>
                      {categoryLabel(cat.name, t)}
                    </Text>
                    {budget !== null ? (
                      <>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
                        </View>
                        <Text style={[styles.budgetDetail, over && styles.overText]}>
                          {over ? `${t('budget.over_budget')} · ` : ''}{currency} {spent.toFixed(2)} {t('budget.of')} {currency} {budget.toFixed(2)}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.noLimit}>{t('budget.no_limit')}</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {selectedCat && (
              <View style={styles.modalCatRow}>
                {selectedCat.icon ? (
                  <Text style={styles.modalIcon}>{selectedCat.icon}</Text>
                ) : (
                  <View style={[styles.dot, { backgroundColor: selectedCat.color, width: 28, height: 28, borderRadius: 14 }]} />
                )}
                <Text style={styles.modalCatName}>
                  {categoryLabel(selectedCat.name, t)}
                </Text>
              </View>
            )}

            <Text style={styles.modalLabel}>{t('budget.set_limit')}</Text>
            <TextInput
              style={styles.amountInput}
              value={inputAmount}
              onChangeText={setInputAmount}
              keyboardType="decimal-pad"
              placeholder={t('budget.amount_placeholder')}
              placeholderTextColor="#9CA3AF"
              autoFocus
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>{t('budget.save')}</Text>
              )}
            </TouchableOpacity>

            {selectedCat && getBudgetForCategory(selectedCat.id) !== null && (
              <TouchableOpacity
                style={[styles.removeBtn, saving && styles.saveBtnDisabled]}
                onPress={handleRemove}
                disabled={saving}
              >
                <Text style={styles.removeBtnText}>{t('budget.remove')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
              <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  subtitle: { fontSize: 13, color: '#9CA3AF', paddingHorizontal: 20, marginBottom: 12 },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  list: { paddingHorizontal: 20, paddingBottom: 40 },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  icon: { fontSize: 20, width: 28, textAlign: 'center' },
  dot: { width: 20, height: 20, borderRadius: 10 },
  rowInfo: { flex: 1 },
  catName: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  progressBar: { height: 5, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden', marginBottom: 3 },
  progressFill: { height: 5, borderRadius: 3 },
  budgetDetail: { fontSize: 11, color: '#9CA3AF' },
  overText: { color: '#EF4444', fontWeight: '600' },
  noLimit: { fontSize: 12, color: '#C4B5FD' },
  chevron: { fontSize: 22, color: '#9CA3AF', marginLeft: 8 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#E5E7EB',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalCatRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  modalIcon: { fontSize: 26 },
  modalCatName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  amountInput: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 16,
  },
  saveBtn: {
    height: 50, backgroundColor: '#4F46E5', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  saveBtnDisabled: { backgroundColor: '#C7D2FE' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  removeBtn: {
    height: 46, backgroundColor: '#FFF1F2', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    borderWidth: 1, borderColor: '#FEE2E2',
  },
  removeBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  cancelBtn: { height: 46, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: '#9CA3AF' },
});
