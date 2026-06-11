import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface CategoryStat {
  category_id: string;
  category_name: string;
  category_color: string;
  total: number;
}

export interface MonthlyStats {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  expensesByCategory: CategoryStat[];
}

export function useMonthlyStats(year: number, month: number) {
  const { user } = useAuth();
  const [stats, setStats] = useState<MonthlyStats>({
    totalExpenses: 0,
    totalIncome: 0,
    balance: 0,
    expensesByCategory: [],
  });
  const [loading, setLoading] = useState(true);

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('transactions')
      .select('type, amount, categories(id, name, color)')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate);

    const rows = data ?? [];
    let totalExpenses = 0;
    let totalIncome = 0;
    const catMap: Record<string, CategoryStat> = {};

    rows.forEach((r: any) => {
      const amount = Number(r.amount);
      if (r.type === 'expense') {
        totalExpenses += amount;
        const catId = r.categories?.id;
        if (catId) {
          catMap[catId] = catMap[catId] ?? {
            category_id: catId,
            category_name: r.categories.name,
            category_color: r.categories.color,
            total: 0,
          };
          catMap[catId].total += amount;
        }
      } else {
        totalIncome += amount;
      }
    });

    setStats({
      totalExpenses,
      totalIncome,
      balance: totalIncome - totalExpenses,
      expensesByCategory: Object.values(catMap).sort((a, b) => b.total - a.total),
    });
    setLoading(false);
  }, [user, startDate, endDate]);

  useEffect(() => { fetch(); }, [fetch]);

  return { stats, loading, refresh: fetch };
}
