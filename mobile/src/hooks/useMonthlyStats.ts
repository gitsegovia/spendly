import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../lib/watermelondb/database';
import TransactionModel from '../lib/watermelondb/models/Transaction';
import CategoryModel from '../lib/watermelondb/models/Category';

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
  const [stats, setStats] = useState<MonthlyStats>({
    totalExpenses: 0,
    totalIncome: 0,
    balance: 0,
    expensesByCategory: [],
  });
  const [loading, setLoading] = useState(true);

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  useEffect(() => {
    const subscription = database.collections
      .get<TransactionModel>('transactions')
      .query(
        Q.where('is_deleted', false),
        Q.where('date', Q.gte(startDate)),
        Q.where('date', Q.lte(endDate)),
      )
      .observe()
      .subscribe(async (txRecords) => {
        if (txRecords.length === 0) {
          setStats({ totalExpenses: 0, totalIncome: 0, balance: 0, expensesByCategory: [] });
          setLoading(false);
          return;
        }

        const catIds = [...new Set(txRecords.map((t) => t.categoryId))];
        const catRecords = await database.collections
          .get<CategoryModel>('categories')
          .query(Q.where('id', Q.oneOf(catIds)))
          .fetch();

        const catMap = new Map(catRecords.map((c) => [c.id, c]));

        let totalExpenses = 0;
        let totalIncome = 0;
        const catStats: Record<string, CategoryStat> = {};

        for (const t of txRecords) {
          const amount = t.amount;
          if (t.type === 'expense') {
            totalExpenses += amount;
            const cat = catMap.get(t.categoryId);
            if (cat) {
              catStats[cat.id] = catStats[cat.id] ?? {
                category_id: cat.id,
                category_name: cat.name,
                category_color: cat.color,
                total: 0,
              };
              catStats[cat.id].total += amount;
            }
          } else {
            totalIncome += amount;
          }
        }

        setStats({
          totalExpenses,
          totalIncome,
          balance: totalIncome - totalExpenses,
          expensesByCategory: Object.values(catStats).sort((a, b) => b.total - a.total),
        });
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [startDate, endDate]);

  return { stats, loading, refresh: () => {} };
}
