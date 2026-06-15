import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { categoryLabel } from '../../src/lib/categoryName';
import { useAuth } from '../../src/contexts/AuthContext';
import { useMonthlyStats } from '../../src/hooks/useMonthlyStats';
import { useFreemium } from '../../src/hooks/useFreemium';
import { useDatabase } from '../../src/contexts/DatabaseContext';
import { MonthNavigator } from '../../src/components/MonthNavigator';
import { PaywallModal } from '../../src/components/PaywallModal';
import { SyncIndicator } from '../../src/components/SyncIndicator';
import { DashboardSkeleton } from '../../src/components/SkeletonLoader';
import { EmptyState } from '../../src/components/EmptyState';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showPaywall, setShowPaywall] = useState(false);
  const { stats, loading } = useMonthlyStats(year, month);
  const { isMonthLocked } = useFreemium();
  const { syncStatus, sync } = useDatabase();

  const prevMonthYear = month === 1 ? year - 1 : year;
  const prevMonthNum = month === 1 ? 12 : month - 1;
  const isAtFreeLimit = isMonthLocked(prevMonthYear, prevMonthNum);

  const currency = profile?.currency ?? 'USD';

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    const now = new Date();
    if (year === now.getFullYear() && month === now.getMonth() + 1) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const balanceColor = stats.balance >= 0 ? '#10B981' : '#EF4444';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      refreshControl={
        <RefreshControl
          refreshing={syncStatus === 'syncing'}
          onRefresh={() => sync('manual')}
          tintColor="#4F46E5"
          colors={['#4F46E5']}
        />
      }
    >
      <Text style={styles.screenTitle}>{t('dashboard.title')}</Text>
      <SyncIndicator />

      <MonthNavigator year={year} month={month} onPrev={prevMonth} onNext={nextMonth} lang={profile?.language} isAtFreeLimit={isAtFreeLimit} onUpgradePress={() => setShowPaywall(true)} />

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Balance */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>{t('dashboard.balance')}</Text>
            <Text style={[styles.balanceAmount, { color: balanceColor }]}>
              {currency} {stats.balance.toFixed(2)}
            </Text>
          </View>

          {/* Resumen */}
          <View style={styles.row}>
            <View style={[styles.summaryCard, styles.incomeCard]}>
              <Text style={styles.summaryLabel}>{t('dashboard.total_income')}</Text>
              <Text style={[styles.summaryAmount, { color: '#10B981' }]}>
                {currency} {stats.totalIncome.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.summaryCard, styles.expenseCard]}>
              <Text style={styles.summaryLabel}>{t('dashboard.total_expenses')}</Text>
              <Text style={[styles.summaryAmount, { color: '#EF4444' }]}>
                {currency} {stats.totalExpenses.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Gastos por categoría */}
          {stats.expensesByCategory.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('dashboard.expenses_by_category')}</Text>
              {stats.expensesByCategory.map((cat) => (
                <View key={cat.category_id} style={styles.catRow}>
                  <View style={[styles.catDot, { backgroundColor: cat.category_color }]} />
                  <Text style={styles.catName}>{categoryLabel(cat.category_name, t)}</Text>
                  <Text style={styles.catAmount}>{currency} {cat.total.toFixed(2)}</Text>
                  <Text style={styles.catPct}>
                    {stats.totalExpenses > 0
                      ? `${((cat.total / stats.totalExpenses) * 100).toFixed(0)}%`
                      : '0%'}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {stats.totalExpenses === 0 && stats.totalIncome === 0 && (
            <EmptyState
              icon="📊"
              title={t('dashboard.no_records')}
              hint={t('dashboard.no_records_hint')}
            />
          )}
        </>
      )}
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20 },
  screenTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
  balanceCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    alignItems: 'center', marginVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  balanceLabel: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  balanceAmount: { fontSize: 36, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  summaryCard: {
    flex: 1, borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  incomeCard: { backgroundColor: '#F0FDF4' },
  expenseCard: { backgroundColor: '#FFF1F2' },
  summaryLabel: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  summaryAmount: { fontSize: 20, fontWeight: '700' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 12 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { flex: 1, fontSize: 14, color: '#374151' },
  catAmount: { fontSize: 14, fontWeight: '600', color: '#111827' },
  catPct: { fontSize: 12, color: '#9CA3AF', width: 36, textAlign: 'right' },
});
