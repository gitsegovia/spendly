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
import { useMonthNavigation } from '../../src/hooks/useMonthNavigation';
import { useDatabase } from '../../src/contexts/DatabaseContext';
import { TransactionCard } from '../../src/components/TransactionCard';
import { AddTransactionModal } from '../../src/components/AddTransactionModal';
import { MonthNavigator } from '../../src/components/MonthNavigator';
import { SyncIndicator } from '../../src/components/SyncIndicator';
import { HeaderActions } from '../../src/components/HeaderActions';
import { AddFab } from '../../src/components/AddFab';
import { PaywallModal } from '../../src/components/PaywallModal';
import { TransactionSkeleton } from '../../src/components/SkeletonLoader';
import { EmptyState } from '../../src/components/EmptyState';
import { categoryLabel } from '../../src/lib/categoryName';

export default function ExpensesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { year, month, prevMonth, nextMonth, canGoPrev, isAtFreeLimit } = useMonthNavigation();
  const [showModal, setShowModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithItems | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);

  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions('expense', year, month);
  const { categories } = useCategories('expense');
  const { syncStatus, sync } = useDatabase();
  const currency = profile?.currency ?? 'USD';

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

  const listHeader = useMemo(() => (
    <>
      <MonthNavigator
        year={year} month={month}
        onPrev={prevMonth} onNext={nextMonth}
        lang={profile?.language}
        isAtFreeLimit={isAtFreeLimit}
        canGoPrev={canGoPrev}
        onUpgradePress={() => setShowPaywall(true)}
      />

      {/* Total card */}
      <View style={styles.totalCard}>
        <View>
          <Text style={styles.totalLabel}>
            {isFiltering ? t('expenses.total_filtered') : t('expenses.total_month')}
          </Text>
          {!loading && (
            <Text style={styles.txCount}>
              {filtered.length} {filtered.length === 1 ? 'transacción' : 'transacciones'}
            </Text>
          )}
        </View>
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
              {c.icon ? (
                <Text style={styles.catIcon}>{c.icon}</Text>
              ) : (
                <View style={[styles.catDot, { backgroundColor: c.color }]} />
              )}
              <Text style={[styles.catChipText, active && { color: c.color, fontWeight: '600' }]}>
                {categoryLabel(c.name, t)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading && (
        <>{[1, 2, 3, 4, 5].map((i) => <TransactionSkeleton key={i} />)}</>
      )}
    </>
  ), [year, month, total, filtered.length, isFiltering, loading, search, filterCategoryId, categories, currency, isAtFreeLimit, canGoPrev, profile?.language]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('expenses.title')}</Text>
        <View style={styles.headerRight}>
          <SyncIndicator />
          <HeaderActions />
        </View>
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
              : <EmptyState icon="💸" title={t('expenses.no_month')} hint={t('expenses.no_month_hint')} />
            : null
        }
        refreshControl={
          <RefreshControl
            refreshing={syncStatus === 'syncing'}
            onRefresh={() => sync('manual')}
            tintColor="#4F46E5"
            colors={['#4F46E5']}
          />
        }
      />

      <AddFab color="#4F46E5" onPress={() => setShowModal(true)} />

      <AddTransactionModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={addTransaction}
        categories={categories}
        type="expense"
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
        type="expense"
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  list: { paddingHorizontal: 20, paddingBottom: 100 },

  totalCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 18, paddingVertical: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderLeftWidth: 4, borderLeftColor: '#EF4444',
  },
  totalLabel: { fontSize: 12, color: '#6B7280', marginBottom: 2, fontWeight: '500' },
  txCount: { fontSize: 11, color: '#9CA3AF' },
  totalAmount: { fontSize: 22, fontWeight: '800', color: '#EF4444' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12, paddingHorizontal: 12, marginBottom: 10, height: 44,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  clearBtn: { padding: 4 },
  clearText: { fontSize: 14, color: '#9CA3AF' },

  catFilter: { marginBottom: 12 },
  catFilterContent: { flexDirection: 'row', gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff',
  },
  catChipActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  catChipText: { fontSize: 13, color: '#6B7280' },
  catChipTextActive: { color: '#4F46E5', fontWeight: '600' },
  catIcon: { fontSize: 13 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
});
