import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useCategories } from '../../src/hooks/useCategories';
import { TransactionCard } from '../../src/components/TransactionCard';
import { AddTransactionModal } from '../../src/components/AddTransactionModal';
import { MonthNavigator } from '../../src/components/MonthNavigator';

export default function IncomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showModal, setShowModal] = useState(false);

  const { transactions, loading, addTransaction, deleteTransaction } = useTransactions('income', year, month);
  const { categories } = useCategories('income');
  const currency = profile?.currency ?? 'USD';

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

  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('income.title')}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addText}>{t('income.add_short')}</Text>
        </TouchableOpacity>
      </View>
      <MonthNavigator year={year} month={month} onPrev={prevMonth} onNext={nextMonth} lang={profile?.language} />
      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>{t('income.total_month')}</Text>
        <Text style={styles.totalAmount}>{currency} {total.toFixed(2)}</Text>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#4F46E5" />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TransactionCard transaction={item} currency={currency} onDelete={deleteTransaction} />
          )}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>{t('income.no_month')}</Text></View>}
        />
      )}
      <AddTransactionModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={addTransaction}
        categories={categories}
        type="income"
        currency={currency}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  addBtn: { backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  totalBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0FDF4', marginHorizontal: 20, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 8 },
  totalLabel: { fontSize: 13, color: '#6B7280' },
  totalAmount: { fontSize: 16, fontWeight: '700', color: '#10B981' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#9CA3AF' },
});
