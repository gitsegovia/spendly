import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../lib/watermelondb/database';
import TransactionModel from '../lib/watermelondb/models/Transaction';
import CategoryModel from '../lib/watermelondb/models/Category';

export interface CategoryStat {
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  total: number;
}

export interface MonthlyStats {
  totalExpenses: number;
  totalIncome: number;
  totalSavings: number;
  balance: number;
  expensesByCategory: CategoryStat[];
  incomeByCategory: CategoryStat[];
  savingsByCategory: CategoryStat[];
}

const EMPTY_STATS: MonthlyStats = {
  totalExpenses: 0,
  totalIncome: 0,
  totalSavings: 0,
  balance: 0,
  expensesByCategory: [],
  incomeByCategory: [],
  savingsByCategory: [],
};

export function useMonthlyStats(year: number, month: number) {
  const [stats, setStats] = useState<MonthlyStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  // Construir la fecha en local — toISOString() convierte a UTC y en zonas UTC+
  // el último día del mes quedaría excluido del rango
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

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
          setStats(EMPTY_STATS);
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
        let totalSavings = 0;
        const catStats: Record<string, CategoryStat> = {};
        const incStats: Record<string, CategoryStat> = {};
        const savStats: Record<string, CategoryStat> = {};

        const addToBucket = (bucket: Record<string, CategoryStat>, cat: CategoryModel, amount: number) => {
          bucket[cat.id] = bucket[cat.id] ?? {
            category_id: cat.id,
            category_name: cat.name,
            category_color: cat.color,
            category_icon: cat.icon ?? '',
            total: 0,
          };
          bucket[cat.id].total += amount;
        };

        for (const t of txRecords) {
          const amount = t.amount;
          const cat = catMap.get(t.categoryId);
          if (t.type === 'expense') {
            totalExpenses += amount;
            if (cat) addToBucket(catStats, cat, amount);
          } else if (t.type === 'saving') {
            totalSavings += amount;
            if (cat) addToBucket(savStats, cat, amount);
          } else {
            totalIncome += amount;
            if (cat) addToBucket(incStats, cat, amount);
          }
        }

        setStats({
          totalExpenses,
          totalIncome,
          totalSavings,
          // El ahorro sale del balance disponible del mes
          balance: totalIncome - totalExpenses - totalSavings,
          expensesByCategory: Object.values(catStats).sort((a, b) => b.total - a.total),
          incomeByCategory: Object.values(incStats).sort((a, b) => b.total - a.total),
          savingsByCategory: Object.values(savStats).sort((a, b) => b.total - a.total),
        });
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [startDate, endDate]);

  return { stats, loading, refresh: () => {} };
}
