import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { categoryLabel } from '../../src/lib/categoryName';
import { formatDate } from '../../src/lib/dateFormat';
import { useAuth } from '../../src/contexts/AuthContext';
import { useMonthlyStats, CategoryStat } from '../../src/hooks/useMonthlyStats';
import { useRecentTransactions } from '../../src/hooks/useRecentTransactions';
import { useBudgets } from '../../src/hooks/useBudgets';
import { useFreemium } from '../../src/hooks/useFreemium';
import { useDatabase } from '../../src/contexts/DatabaseContext';
import { MonthNavigator } from '../../src/components/MonthNavigator';
import { PaywallModal } from '../../src/components/PaywallModal';
import { SyncIndicator } from '../../src/components/SyncIndicator';
import { DashboardSkeleton } from '../../src/components/SkeletonLoader';
import { EmptyState } from '../../src/components/EmptyState';

const MONTH_NAMES: Record<string, string[]> = {
  es: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
};

export default function DashboardScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showPaywall, setShowPaywall] = useState(false);

  const { stats, loading } = useMonthlyStats(year, month);
  const { transactions: recent } = useRecentTransactions(year, month);
  const { getBudgetForCategory } = useBudgets();
  const { isMonthLocked } = useFreemium();
  const { syncStatus, sync } = useDatabase();

  const prevMonthYear = month === 1 ? year - 1 : year;
  const prevMonthNum = month === 1 ? 12 : month - 1;
  const isAtFreeLimit = isMonthLocked(prevMonthYear, prevMonthNum);

  const currency = profile?.currency ?? 'USD';
  const lang = profile?.language ?? 'es';
  const monthName = (MONTH_NAMES[lang] ?? MONTH_NAMES['es'])[month - 1];

  const savingsRate = stats.totalIncome > 0
    ? ((stats.totalIncome - stats.totalExpenses) / stats.totalIncome) * 100
    : 0;
  const hasData = stats.totalExpenses > 0 || stats.totalIncome > 0;

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
      <View style={styles.topRow}>
        <Text style={styles.screenTitle}>{t('dashboard.title')}</Text>
        <SyncIndicator />
      </View>

      <MonthNavigator
        year={year} month={month}
        onPrev={prevMonth} onNext={nextMonth}
        lang={lang}
        isAtFreeLimit={isAtFreeLimit}
        onUpgradePress={() => setShowPaywall(true)}
      />

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Hero balance card */}
          <View style={styles.heroCard}>
            <Text style={styles.heroMonth}>{monthName} {year}</Text>
            <Text style={styles.heroLabel}>{t('dashboard.balance')}</Text>
            <Text
              style={[styles.heroBalance, { color: stats.balance >= 0 ? '#111827' : '#EF4444' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {stats.balance >= 0 ? '+' : '-'}{currency} {Math.abs(stats.balance).toFixed(2)}
            </Text>

            <View style={styles.heroPills}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillLabel}>{t('dashboard.total_income')}</Text>
                <Text style={[styles.heroPillAmount, { color: '#10B981' }]}>
                  {currency} {stats.totalIncome.toFixed(2)}
                </Text>
              </View>
              <View style={styles.heroPillDivider} />
              <View style={styles.heroPill}>
                <Text style={styles.heroPillLabel}>{t('dashboard.total_expenses')}</Text>
                <Text style={[styles.heroPillAmount, { color: '#EF4444' }]}>
                  {currency} {stats.totalExpenses.toFixed(2)}
                </Text>
              </View>
            </View>

            {stats.totalIncome > 0 && (
              <View style={[
                styles.savingsBadge,
                { backgroundColor: savingsRate >= 0 ? '#F0FDF4' : '#FFF1F2' },
              ]}>
                <Text style={[
                  styles.savingsText,
                  { color: savingsRate >= 0 ? '#10B981' : '#EF4444' },
                ]}>
                  {t('stats.savings_rate')}: {savingsRate.toFixed(0)}%
                </Text>
              </View>
            )}
          </View>

          {/* Expenses by category */}
          {stats.expensesByCategory.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('dashboard.expenses_by_category')}</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/expenses')}>
                  <Text style={styles.seeAll}>{t('dashboard.see_all')} ›</Text>
                </TouchableOpacity>
              </View>
              {stats.expensesByCategory.slice(0, 4).map((cat) => (
                <CategoryRow
                  key={cat.category_id}
                  cat={cat}
                  total={stats.totalExpenses}
                  currency={currency}
                  t={t}
                  budget={getBudgetForCategory(cat.category_id)}
                />
              ))}
            </View>
          )}

          {/* Recent transactions */}
          {recent.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('dashboard.recent_transactions')}</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/expenses')}>
                  <Text style={styles.seeAll}>{t('dashboard.see_all')} ›</Text>
                </TouchableOpacity>
              </View>
              {recent.map((tx, idx) => (
                <View
                  key={tx.id}
                  style={[styles.txRow, idx === recent.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <View style={styles.txLeft}>
                    {tx.category_icon ? (
                      <View style={[styles.txIconWrap, { backgroundColor: (tx.category_color ?? '#6B7280') + '18' }]}>
                        <Text style={styles.txIcon}>{tx.category_icon}</Text>
                      </View>
                    ) : (
                      <View style={[styles.txIconWrap, { backgroundColor: (tx.category_color ?? '#6B7280') + '18' }]}>
                        <View style={[styles.txDot, { backgroundColor: tx.category_color ?? '#6B7280' }]} />
                      </View>
                    )}
                    <View style={styles.txInfo}>
                      <Text style={styles.txCategory} numberOfLines={1}>
                        {categoryLabel(tx.category_name, t)}
                      </Text>
                      {tx.notes ? (
                        <Text style={styles.txNotes} numberOfLines={1}>{tx.notes}</Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[
                      styles.txAmount,
                      { color: tx.type === 'income' ? '#10B981' : '#EF4444' },
                    ]}>
                      {tx.type === 'income' ? '+' : '-'}{currency} {tx.amount.toFixed(2)}
                    </Text>
                    <Text style={styles.txDate}>{formatDate(tx.date, lang)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {!hasData && (
            <EmptyState
              icon="📊"
              title={t('dashboard.no_records')}
              hint={t('dashboard.no_records_hint')}
            />
          )}
        </>
      )}

      <View style={{ height: 24 }} />
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </ScrollView>
  );
}

interface CategoryRowProps {
  cat: CategoryStat;
  total: number;
  currency: string;
  t: (key: string, opts?: any) => string;
  budget?: number | null;
}

function CategoryRow({ cat, total, currency, t, budget }: CategoryRowProps) {
  const color = cat.category_color || '#9CA3AF';

  if (budget != null && budget > 0) {
    const over = cat.total > budget;
    const pct = Math.min((cat.total / budget) * 100, 100);
    const pctOfTotal = total > 0 ? (cat.total / total) * 100 : 0;
    const barColor = over ? '#EF4444' : '#4F46E5';
    return (
      <View style={catStyles.wrap}>
        <View style={catStyles.top}>
          <View style={catStyles.left}>
            <View style={[catStyles.iconWrap, { backgroundColor: color + '18' }]}>
              {cat.category_icon ? (
                <Text style={catStyles.icon}>{cat.category_icon}</Text>
              ) : (
                <View style={[catStyles.dot, { backgroundColor: color }]} />
              )}
            </View>
            <Text style={catStyles.name} numberOfLines={1}>
              {categoryLabel(cat.category_name, t)}
            </Text>
          </View>
          <View style={catStyles.rightCol}>
            <Text style={[catStyles.detail, over && catStyles.detailOver]}>
              {pctOfTotal.toFixed(0)}% · {currency} {cat.total.toFixed(2)}
            </Text>
            <Text style={catStyles.budgetLimit}>
              {over ? `${t('budget.over_budget')} · ` : ''}{t('budget.of')} {currency} {budget.toFixed(2)}
            </Text>
          </View>
        </View>
        <View style={catStyles.bar}>
          <View style={[catStyles.fill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
        </View>
      </View>
    );
  }

  const pct = total > 0 ? (cat.total / total) * 100 : 0;
  return (
    <View style={catStyles.wrap}>
      <View style={catStyles.top}>
        <View style={catStyles.left}>
          <View style={[catStyles.iconWrap, { backgroundColor: color + '18' }]}>
            {cat.category_icon ? (
              <Text style={catStyles.icon}>{cat.category_icon}</Text>
            ) : (
              <View style={[catStyles.dot, { backgroundColor: color }]} />
            )}
          </View>
          <Text style={catStyles.name} numberOfLines={1}>
            {categoryLabel(cat.category_name, t)}
          </Text>
        </View>
        <Text style={catStyles.detail}>{pct.toFixed(0)}% · {currency} {cat.total.toFixed(2)}</Text>
      </View>
      <View style={catStyles.bar}>
        <View style={[catStyles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const catStyles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  top: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 5,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  iconWrap: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  icon: { fontSize: 15 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { fontSize: 14, color: '#374151', fontWeight: '500', flex: 1 },
  detail: { fontSize: 12, color: '#9CA3AF', marginLeft: 8 },
  detailOver: { color: '#EF4444', fontWeight: '600' },
  rightCol: { alignItems: 'flex-end', marginLeft: 8 },
  budgetLimit: { fontSize: 10, color: '#C4B5FD', marginTop: 2 },
  bar: { height: 5, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { paddingHorizontal: 20, paddingBottom: 32 },

  topRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  screenTitle: { fontSize: 24, fontWeight: '700', color: '#111827' },

  // Hero card
  heroCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginTop: 12,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 4,
  },
  heroMonth: { fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginBottom: 2 },
  heroLabel: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  heroBalance: { fontSize: 40, fontWeight: '800', letterSpacing: -1, marginBottom: 20 },

  heroPills: {
    flexDirection: 'row', width: '100%',
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14,
    marginBottom: 12,
  },
  heroPill: { flex: 1, alignItems: 'center', gap: 3 },
  heroPillLabel: { fontSize: 11, color: '#9CA3AF' },
  heroPillAmount: { fontSize: 15, fontWeight: '700' },
  heroPillDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 8 },

  savingsBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  savingsText: { fontSize: 13, fontWeight: '600' },

  // Sections
  section: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  seeAll: { fontSize: 13, color: '#4F46E5', fontWeight: '600' },

  // Recent transactions
  txRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  txIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  txIcon: { fontSize: 18 },
  txDot: { width: 10, height: 10, borderRadius: 5 },
  txInfo: { flex: 1 },
  txCategory: { fontSize: 14, fontWeight: '600', color: '#111827' },
  txNotes: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  txRight: { alignItems: 'flex-end', marginLeft: 8 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txDate: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
});
