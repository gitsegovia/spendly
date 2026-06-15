import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, TextInput, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTransactions, TransactionWithItems } from '../../src/hooks/useTransactions';
import { useCategories } from '../../src/hooks/useCategories';
import { useFreemium } from '../../src/hooks/useFreemium';
import { useDatabase } from '../../src/contexts/DatabaseContext';
import { TransactionCard } from '../../src/components/TransactionCard';
import { AddTransactionModal } from '../../src/components/AddTransactionModal';
import { MonthNavigator } from '../../src/components/MonthNavigator';
import { PaywallModal } from '../../src/components/PaywallModal';
import { TransactionSkeleton } from '../../src/components/SkeletonLoader';
import { EmptyState } from '../../src/components/EmptyState';
import { categoryLabel } from '../../src/lib/categoryName';

export default function IncomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showModal, setShowModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithItems | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);

  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions('income', year, month);
  const { categories } = useCategories('income');
  const { isMonthLocked } = useFreemium();
  const { syncStatus, sync } = useDatabase();
  const currency = profile?.currency ?? 'USD';

  const prevMonthYear = month === 1 ? year - 1 : year;
  const prevMonthNum = month === 1 ? 12 : month - 1;
  const isAtFreeLimit = isMonthLocked(prevMonthYear, prevMonthNum);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    const n = new Date();
    if (year === n.getFullYear() && month === n.getMonth() + 1) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (filterCategoryId && tx.category_id !== filterCategoryId) return false;
      if (q && !(tx.notes ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [transactions, search, filterCategoryId]);

  const total = filtered.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const isFiltering = !!search.trim() || !!filterCategoryId;

  const listHeader = (
    <>
      <MonthNavigator
        year={year} month={month}
        onPrev={prevMonth} onNext={nextMonth}
        lang={profile?.language}
        isAtFreeLimit={isAtFreeLimit}
        onUpgradePress={() => setShowPaywall(true)}
      />

      {/* Total */}
      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>
          {isFiltering ? t('income.total_filtered') : t('income.total_month')}
        </Text>
        <Text style={styles.totalAmount}>{currency} {total.toFixed(2)}</Text>
      </View>

      {/* Búsqueda */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('common.search')}
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtro por categoría */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catFilterContent}
        style={styles.catFilter}
      >
        <TouchableOpacity
          style={[styles.catChip, !filterCategoryId && styles.catChipActive]}
          onPress={() => setFilterCategoryId(null)}
        >
          <Text style={[styles.catChipText, !filterCategoryId && styles.catChipTextActive]}>
            {t('common.all')}
          </Text>
        </TouchableOpacity>
        {categories.map((c) => {
          const active = filterCategoryId === c.id;
          return (
            <TouchableOpacity
              key={c.id}
              style={[styles.catChip, active && { borderColor: c.color, backgroundColor: c.color + '20' }]}
              onPress={() => setFilterCategoryId(active ? null : c.id)}
            >
              <View style={[styles.catDot, { backgroundColor: c.color }]} />
              <Text style={[styles.catChipText, active && { color: c.color, fontWeight: '600' }]}>
                {categoryLabel(c.name, t)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading && (
        <>
          {[1, 2, 3, 4, 5].map((i) => <TransactionSkeleton key={i} />)}
        </>
      )}
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header fijo */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('income.title')}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addText}>{t('income.add_short')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => (
          <TransactionCard
            transaction={item}
            currency={currency}
            onDelete={deleteTransaction}
            onEdit={(tx) => setEditingTransaction(tx)}
          />
        )}
        ListEmptyComponent={
          !loading
            ? isFiltering
              ? <EmptyState icon="🔍" title={t('common.no_results')} />
              : <EmptyState icon="💰" title={t('income.no_month')} hint={t('income.no_month_hint')} />
            : null
        }
        refreshControl={
          <RefreshControl
            refreshing={syncStatus === 'syncing'}
            onRefresh={() => sync('manual')}
            tintColor="#10B981"
            colors={['#10B981']}
          />
        }
      />

      <AddTransactionModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={addTransaction}
        categories={categories}
        type="income"
        currency={currency}
      />
      <AddTransactionModal
        visible={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={addTransaction}
        onUpdate={updateTransaction}
        initialValues={editingTransaction ? {
          id: editingTransaction.id,
          categoryId: editingTransaction.category_id,
          amount: Number(editingTransaction.amount),
          date: editingTransaction.date,
          notes: editingTransaction.notes ?? '',
          items: editingTransaction.items.map((i) => ({
            name: i.name,
            amount: Number(i.amount),
            quantity: Number(i.quantity),
          })),
        } : undefined}
        categories={categories}
        type="income"
        currency={currency}
      />
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  addBtn: { backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  list: { paddingHorizontal: 20, paddingBottom: 32 },

  totalBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F0FDF4', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10, marginBottom: 12,
  },
  totalLabel: { fontSize: 13, color: '#6B7280' },
  totalAmount: { fontSize: 16, fontWeight: '700', color: '#10B981' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 12, marginBottom: 10, height: 42,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  clearBtn: { padding: 4 },
  clearText: { fontSize: 14, color: '#9CA3AF' },

  catFilter: { marginBottom: 12 },
  catFilterContent: { flexDirection: 'row', gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff',
  },
  catChipActive: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
  catChipText: { fontSize: 13, color: '#6B7280' },
  catChipTextActive: { color: '#10B981', fontWeight: '600' },
  catDot: { width: 8, height: 8, borderRadius: 4 },
});
