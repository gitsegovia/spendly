import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { PieChart } from 'react-native-gifted-charts';
import { BarChart } from 'react-native-gifted-charts';
import { categoryLabel } from '../../src/lib/categoryName';
import { useAuth } from '../../src/contexts/AuthContext';
import { useMonthlyStats } from '../../src/hooks/useMonthlyStats';
import { useMonthlyTrend } from '../../src/hooks/useMonthlyTrend';
import { MonthNavigator } from '../../src/components/MonthNavigator';

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

  const balanceColor = stats.balance >= 0 ? '#10B981' : '#EF4444';

  // Donut chart data
  const pieData = stats.expensesByCategory.map(cat => ({
    value: cat.total,
    color: cat.category_color || '#9CA3AF',
  }));

  // Grouped bar chart data: [income, expense] pairs per month
  const trendMax = Math.max(...trend.flatMap(m => [m.income, m.expenses]), 1);
  const barData = trend.flatMap((m, i) => [
    {
      value: m.income,
      frontColor: '#10B981',
      label: m.label,
      spacing: 3,
      labelTextStyle: {
        fontSize: 10,
        color: (m.year === year && m.month === month) ? '#4F46E5' : '#9CA3AF',
      },
    },
    {
      value: m.expenses,
      frontColor: '#EF4444',
      spacing: i < trend.length - 1 ? 18 : 0,
    },
  ]);

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

          {/* Donut chart — gastos por categoría */}
          {stats.expensesByCategory.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('stats.expenses_by_category')}</Text>
              <View style={styles.chartRow}>
                <PieChart
                  data={pieData}
                  donut
                  radius={80}
                  innerRadius={54}
                  centerLabelComponent={() => (
                    <View style={styles.donutCenter}>
                      <Text style={styles.donutLabel}>{currency}</Text>
                      <Text style={styles.donutAmount}>{stats.totalExpenses.toFixed(0)}</Text>
                    </View>
                  )}
                />
                <View style={styles.legend}>
                  {stats.expensesByCategory.map((cat) => {
                    const pct = stats.totalExpenses > 0
                      ? (cat.total / stats.totalExpenses) * 100
                      : 0;
                    return (
                      <View key={cat.category_id} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: cat.category_color || '#9CA3AF' }]} />
                        <View style={styles.legendText}>
                          <Text style={styles.legendName} numberOfLines={1}>
                            {categoryLabel(cat.category_name, t)}
                          </Text>
                          <Text style={styles.legendDetail}>
                            {pct.toFixed(0)}% · {currency} {cat.total.toFixed(0)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
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

            <BarChart
              data={barData}
              barWidth={9}
              barBorderTopLeftRadius={3}
              barBorderTopRightRadius={3}
              height={110}
              noOfSections={3}
              maxValue={Math.ceil(trendMax * 1.25)}
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor="#E5E7EB"
              rulesColor="#F3F4F6"
              hideYAxisText
              xAxisLabelTextStyle={{ fontSize: 10, color: '#9CA3AF' }}
              isAnimated
            />
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

  // Donut chart layout
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutCenter: { alignItems: 'center' },
  donutLabel: { fontSize: 11, color: '#6B7280' },
  donutAmount: { fontSize: 15, fontWeight: '700', color: '#111827' },

  // Legend al lado del donut
  legend: { flex: 1, gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  legendText: { flex: 1 },
  legendName: { fontSize: 13, color: '#374151', fontWeight: '500' },
  legendDetail: { fontSize: 11, color: '#9CA3AF' },

  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },

  // Trend section
  trendLegend: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  trendLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendDot: { width: 10, height: 10, borderRadius: 5 },
  trendLegendLabel: { fontSize: 13, color: '#6B7280' },
});
