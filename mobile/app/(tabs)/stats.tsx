import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { categoryLabel } from '../../src/lib/categoryName';
import { useAuth } from '../../src/contexts/AuthContext';
import { useMonthlyStats } from '../../src/hooks/useMonthlyStats';
import { useMonthlyTrend } from '../../src/hooks/useMonthlyTrend';
import { MonthNavigator } from '../../src/components/MonthNavigator';

const BAR_MAX_HEIGHT = 80;

export default function StatsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { stats, loading: statsLoading } = useMonthlyStats(year, month);
  const { trend, loading: trendLoading } = useMonthlyTrend(year, month);

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

  const trendMax = Math.max(...trend.flatMap(m => [m.income, m.expenses]), 1);
  const balanceColor = stats.balance >= 0 ? '#10B981' : '#EF4444';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
    >
      <Text style={styles.screenTitle}>{t('stats.title')}</Text>

      <MonthNavigator year={year} month={month} onPrev={prevMonth} onNext={nextMonth} lang={profile?.language} />

      {statsLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color="#4F46E5" />
      ) : (
        <>
          {/* Resumen del mes */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: '#F0FDF4' }]}>
              <Text style={styles.summaryLabel}>{t('dashboard.total_income')}</Text>
              <Text style={[styles.summaryAmount, { color: '#10B981' }]}>
                {currency} {stats.totalIncome.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#FFF1F2' }]}>
              <Text style={styles.summaryLabel}>{t('dashboard.total_expenses')}</Text>
              <Text style={[styles.summaryAmount, { color: '#EF4444' }]}>
                {currency} {stats.totalExpenses.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>{t('stats.balance_month')}</Text>
            <Text style={[styles.balanceAmount, { color: balanceColor }]}>
              {stats.balance >= 0 ? '+' : ''}{currency} {stats.balance.toFixed(2)}
            </Text>
          </View>

          {/* Gastos por categoría */}
          {stats.expensesByCategory.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('stats.expenses_by_category')}</Text>
              {stats.expensesByCategory.map((cat) => {
                const pct = stats.totalExpenses > 0
                  ? (cat.total / stats.totalExpenses) * 100
                  : 0;
                return (
                  <View key={cat.category_id} style={styles.catItem}>
                    <View style={styles.catLabelRow}>
                      <View style={[styles.catDot, { backgroundColor: cat.category_color }]} />
                      <Text style={styles.catName}>{categoryLabel(cat.category_name, t)}</Text>
                      <Text style={styles.catPct}>{pct.toFixed(0)}%</Text>
                      <Text style={styles.catAmount}>{currency} {cat.total.toFixed(2)}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${pct}%` as any, backgroundColor: cat.category_color },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {stats.totalExpenses === 0 && stats.totalIncome === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('stats.no_records')}</Text>
            </View>
          )}
        </>
      )}

      {/* Tendencia 6 meses */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('stats.trend_6months')}</Text>
        {trendLoading ? (
          <ActivityIndicator color="#4F46E5" style={{ marginVertical: 20 }} />
        ) : (
          <>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendLabel}>{t('dashboard.total_income')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendLabel}>{t('dashboard.total_expenses')}</Text>
              </View>
            </View>

            <View style={styles.chart}>
              {trend.map((m) => {
                const incomeH = trendMax > 0 ? (m.income / trendMax) * BAR_MAX_HEIGHT : 0;
                const expenseH = trendMax > 0 ? (m.expenses / trendMax) * BAR_MAX_HEIGHT : 0;
                const isCurrentMonth = m.year === year && m.month === month;
                return (
                  <View key={`${m.year}-${m.month}`} style={styles.chartColumn}>
                    <View style={styles.barsGroup}>
                      <View style={[
                        styles.bar,
                        { height: Math.max(incomeH, 2), backgroundColor: '#10B981' },
                        isCurrentMonth && styles.barHighlight,
                      ]} />
                      <View style={[
                        styles.bar,
                        { height: Math.max(expenseH, 2), backgroundColor: '#EF4444' },
                        isCurrentMonth && styles.barHighlight,
                      ]} />
                    </View>
                    <Text style={[styles.chartLabel, isCurrentMonth && styles.chartLabelActive]}>
                      {m.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  screenTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },

  summaryRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 16 },
  summaryLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  summaryAmount: { fontSize: 17, fontWeight: '700' },

  balanceCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  balanceLabel: { fontSize: 14, color: '#6B7280' },
  balanceAmount: { fontSize: 20, fontWeight: '700' },

  section: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 16 },

  catItem: { marginBottom: 14 },
  catLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { flex: 1, fontSize: 14, color: '#374151' },
  catPct: { fontSize: 12, color: '#9CA3AF', width: 32, textAlign: 'right' },
  catAmount: { fontSize: 13, fontWeight: '600', color: '#111827', width: 80, textAlign: 'right' },
  barTrack: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },

  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },

  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 13, color: '#6B7280' },

  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  chartColumn: { flex: 1, alignItems: 'center' },
  barsGroup: {
    flexDirection: 'row', gap: 3, alignItems: 'flex-end',
    height: BAR_MAX_HEIGHT, marginBottom: 8,
  },
  bar: { width: 10, borderRadius: 4, minHeight: 2 },
  barHighlight: { opacity: 1 },
  chartLabel: { fontSize: 11, color: '#9CA3AF' },
  chartLabelActive: { color: '#4F46E5', fontWeight: '600' },
});
