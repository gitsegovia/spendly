import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { categoryLabel } from '../../src/lib/categoryName';
import { useAuth } from '../../src/contexts/AuthContext';
import { useMonthlyStats, CategoryStat } from '../../src/hooks/useMonthlyStats';
import { useMonthlyTrend } from '../../src/hooks/useMonthlyTrend';
import { useFreemium } from '../../src/hooks/useFreemium';
import { useDatabase } from '../../src/contexts/DatabaseContext';
import { MonthNavigator } from '../../src/components/MonthNavigator';
import { PaywallModal } from '../../src/components/PaywallModal';
import { EmptyState } from '../../src/components/EmptyState';

export default function StatsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { profile } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showPaywall, setShowPaywall] = useState(false);

  const { stats, loading: statsLoading } = useMonthlyStats(year, month);
  const { trend, loading: trendLoading } = useMonthlyTrend(year, month, profile?.language ?? 'es');
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

  const balanceColor = stats.balance >= 0 ? '#10B981' : '#EF4444';
  const savingsRate = stats.totalIncome > 0
    ? ((stats.totalIncome - stats.totalExpenses) / stats.totalIncome) * 100
    : 0;

  const pieData = stats.expensesByCategory.map(cat => ({
    value: cat.total,
    color: cat.category_color || '#9CA3AF',
  }));

  const trendMax = Math.max(...trend.flatMap(m => [m.income, m.expenses]), 1);
  // section padding 16*2 + screen padding 20*2 = 72px total horizontal
  const chartWidth = screenWidth - 72;
  // 6 months × 2 bars = 12 bars. Fill chartWidth:
  // total = 12*barW + 6*innerSpacing + 5*groupSpacing
  const innerSpacing = 3;
  const groupSpacing = 14;
  const barW = Math.max(10, Math.floor((chartWidth - 6 * innerSpacing - 5 * groupSpacing) / 12));

  const barData = trend.flatMap((m, i) => [
    {
      value: m.income,
      frontColor: '#10B981',
      label: m.label,
      spacing: innerSpacing,
      labelTextStyle: {
        fontSize: 10,
        color: (m.year === year && m.month === month) ? '#4F46E5' : '#9CA3AF',
      },
    },
    {
      value: m.expenses,
      frontColor: '#EF4444',
      spacing: i < trend.length - 1 ? groupSpacing : 0,
    },
  ]);

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
      <Text style={styles.screenTitle}>{t('stats.title')}</Text>

      <MonthNavigator
        year={year} month={month}
        onPrev={prevMonth} onNext={nextMonth}
        lang={profile?.language}
        isAtFreeLimit={isAtFreeLimit}
        onUpgradePress={() => setShowPaywall(true)}
      />

      {statsLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color="#4F46E5" />
      ) : (
        <>
          {/* Hero balance card */}
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>{t('stats.balance_month')}</Text>
            <Text
              style={[styles.heroAmount, { color: balanceColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {stats.balance >= 0 ? '+' : '-'}{currency} {Math.abs(stats.balance).toFixed(2)}
            </Text>

            <View style={styles.heroDividerH} />

            <View style={styles.heroRow}>
              <View style={styles.heroCol}>
                <View style={[styles.heroBullet, { backgroundColor: '#D1FAE5' }]} />
                <Text style={styles.heroColLabel}>{t('dashboard.total_income')}</Text>
                <Text style={[styles.heroColAmount, { color: '#10B981' }]}>
                  {currency} {stats.totalIncome.toFixed(2)}
                </Text>
              </View>
              <View style={styles.heroDividerV} />
              <View style={styles.heroCol}>
                <View style={[styles.heroBullet, { backgroundColor: '#FEE2E2' }]} />
                <Text style={styles.heroColLabel}>{t('dashboard.total_expenses')}</Text>
                <Text style={[styles.heroColAmount, { color: '#EF4444' }]}>
                  {currency} {stats.totalExpenses.toFixed(2)}
                </Text>
              </View>
            </View>

            {stats.totalIncome > 0 && (
              <View style={styles.savingsRow}>
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
              </View>
            )}
          </View>

          {/* Expenses by category */}
          {stats.expensesByCategory.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('stats.expenses_by_category')}</Text>
              <View style={styles.donutWrap}>
                <PieChart
                  data={pieData}
                  donut
                  radius={88}
                  innerRadius={60}
                  centerLabelComponent={() => (
                    <View style={styles.donutCenter}>
                      <Text style={styles.donutLabel}>{currency}</Text>
                      <Text style={styles.donutAmount}>{stats.totalExpenses.toFixed(0)}</Text>
                    </View>
                  )}
                />
              </View>
              <View style={styles.catList}>
                {stats.expensesByCategory.map((cat) => (
                  <CategoryRow
                    key={cat.category_id}
                    cat={cat}
                    total={stats.totalExpenses}
                    currency={currency}
                    t={t}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Income by category */}
          {stats.incomeByCategory.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('stats.income_by_category')}</Text>
              <View style={styles.catList}>
                {stats.incomeByCategory.map((cat) => (
                  <CategoryRow
                    key={cat.category_id}
                    cat={cat}
                    total={stats.totalIncome}
                    currency={currency}
                    t={t}
                  />
                ))}
              </View>
            </View>
          )}

          {stats.totalExpenses === 0 && stats.totalIncome === 0 && (
            <EmptyState icon="📊" title={t('stats.no_records')} />
          )}
        </>
      )}

      {/* 6-month trend */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('stats.trend_6months')}</Text>
        {trendLoading ? (
          <ActivityIndicator color="#4F46E5" style={{ marginVertical: 20 }} />
        ) : (
          <>
            <View style={styles.trendLegend}>
              <View style={styles.trendLegendItem}>
                <View style={[styles.trendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.trendLegendLabel}>{t('dashboard.total_income')}</Text>
              </View>
              <View style={styles.trendLegendItem}>
                <View style={[styles.trendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.trendLegendLabel}>{t('dashboard.total_expenses')}</Text>
              </View>
            </View>
            <View style={{ overflow: 'hidden' }}>
              <BarChart
                data={barData}
                barWidth={barW}
                barBorderTopLeftRadius={4}
                barBorderTopRightRadius={4}
                height={120}
                width={chartWidth}
                noOfSections={3}
                maxValue={Math.ceil(trendMax * 1.25)}
                yAxisThickness={0}
                yAxisLabelWidth={0}
                initialSpacing={0}
                xAxisThickness={1}
                xAxisColor="#E5E7EB"
                rulesColor="#F3F4F6"
                hideYAxisText
                xAxisLabelTextStyle={{ fontSize: 10, color: '#9CA3AF' }}
                isAnimated
              />
            </View>
          </>
        )}
      </View>

      <View style={{ height: 24 }} />
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </ScrollView>
  );
}

interface CategoryRowProps {
  cat: CategoryStat;
  total: number;
  currency: string;
  t: (key: string) => string;
}

function CategoryRow({ cat, total, currency, t }: CategoryRowProps) {
  const pct = total > 0 ? (cat.total / total) * 100 : 0;
  const color = cat.category_color || '#9CA3AF';

  return (
    <View style={rowStyles.wrap}>
      <View style={rowStyles.top}>
        <View style={rowStyles.left}>
          <View style={[rowStyles.iconWrap, { backgroundColor: color + '18' }]}>
            {cat.category_icon ? (
              <Text style={rowStyles.icon}>{cat.category_icon}</Text>
            ) : (
              <View style={[rowStyles.dot, { backgroundColor: color }]} />
            )}
          </View>
          <Text style={rowStyles.name} numberOfLines={1}>
            {categoryLabel(cat.category_name, t)}
          </Text>
        </View>
        <Text style={rowStyles.detail}>
          {pct.toFixed(0)}% · {currency} {cat.total.toFixed(2)}
        </Text>
      </View>
      <View style={rowStyles.bar}>
        <View style={[rowStyles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  top: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  iconWrap: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  icon: { fontSize: 15 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { fontSize: 14, color: '#374151', fontWeight: '500', flex: 1 },
  detail: { fontSize: 12, color: '#9CA3AF', marginLeft: 8 },
  bar: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  screenTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },

  heroCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  heroLabel: {
    fontSize: 13, color: '#9CA3AF', fontWeight: '500',
    marginBottom: 6, textAlign: 'center',
  },
  heroAmount: { fontSize: 36, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  heroDividerH: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroCol: { flex: 1, alignItems: 'center', gap: 4 },
  heroBullet: { width: 28, height: 28, borderRadius: 14, marginBottom: 2 },
  heroColLabel: { fontSize: 12, color: '#9CA3AF' },
  heroColAmount: { fontSize: 17, fontWeight: '700' },
  heroDividerV: { width: 1, height: 52, backgroundColor: '#F3F4F6' },
  savingsRow: { marginTop: 14, alignItems: 'center' },
  savingsBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  savingsText: { fontSize: 13, fontWeight: '600' },

  section: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 16 },

  donutWrap: { alignItems: 'center', marginBottom: 20 },
  donutCenter: { alignItems: 'center' },
  donutLabel: { fontSize: 11, color: '#6B7280' },
  donutAmount: { fontSize: 16, fontWeight: '700', color: '#111827' },

  catList: {},

  trendLegend: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  trendLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendDot: { width: 10, height: 10, borderRadius: 5 },
  trendLegendLabel: { fontSize: 13, color: '#6B7280' },
});
