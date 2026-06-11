import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface MonthTrend {
  year: number;
  month: number;
  label: string;
  income: number;
  expenses: number;
}

const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export function useMonthlyTrend(endYear: number, endMonth: number) {
  const { user } = useAuth();
  const [trend, setTrend] = useState<MonthTrend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Últimos 6 meses terminando en endYear/endMonth
    const months: { year: number; month: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(endYear, endMonth - 1 - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    const startDate = `${months[0].year}-${String(months[0].month).padStart(2, '0')}-01`;
    const lastMonth = months[months.length - 1];
    const endDate = new Date(lastMonth.year, lastMonth.month, 0).toISOString().split('T')[0];

    const { data } = await supabase
      .from('transactions')
      .select('type, amount, date')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate);

    const map: Record<string, { income: number; expenses: number }> = {};
    months.forEach(({ year, month }) => {
      map[`${year}-${month}`] = { income: 0, expenses: 0 };
    });

    (data ?? []).forEach((r: any) => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!map[key]) return;
      if (r.type === 'income') map[key].income += Number(r.amount);
      else map[key].expenses += Number(r.amount);
    });

    setTrend(
      months.map(({ year, month }) => ({
        year,
        month,
        label: MONTH_LABELS[month - 1],
        ...map[`${year}-${month}`],
      }))
    );
    setLoading(false);
  }, [user, endYear, endMonth]);

  useEffect(() => { fetch(); }, [fetch]);

  return { trend, loading };
}
