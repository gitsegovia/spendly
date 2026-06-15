import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../lib/watermelondb/database';
import TransactionModel from '../lib/watermelondb/models/Transaction';

export interface MonthTrend {
  year: number;
  month: number;
  label: string;
  income: number;
  expenses: number;
}

const MONTH_LABELS: Record<string, string[]> = {
  es: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
};

export function useMonthlyTrend(endYear: number, endMonth: number, lang = 'es') {
  const [trend, setTrend] = useState<MonthTrend[]>([]);
  const [loading, setLoading] = useState(true);

  const labels = MONTH_LABELS[lang] ?? MONTH_LABELS['es'];

  useEffect(() => {
    const months: { year: number; month: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(endYear, endMonth - 1 - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    const startDate = `${months[0].year}-${String(months[0].month).padStart(2, '0')}-01`;
    const lastMonth = months[months.length - 1];
    const endDate = new Date(lastMonth.year, lastMonth.month, 0).toISOString().split('T')[0];

    const subscription = database.collections
      .get<TransactionModel>('transactions')
      .query(
        Q.where('is_deleted', false),
        Q.where('date', Q.gte(startDate)),
        Q.where('date', Q.lte(endDate)),
      )
      .observe()
      .subscribe((records) => {
        const map: Record<string, { income: number; expenses: number }> = {};
        months.forEach(({ year, month }) => {
          map[`${year}-${month}`] = { income: 0, expenses: 0 };
        });

        for (const r of records) {
          const [y, m] = r.date.split('-').map(Number);
          const key = `${y}-${m}`;
          if (!map[key]) continue;
          if (r.type === 'income') map[key].income += r.amount;
          else map[key].expenses += r.amount;
        }

        setTrend(
          months.map(({ year, month }) => ({
            year,
            month,
            label: labels[month - 1],
            ...map[`${year}-${month}`],
          }))
        );
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [endYear, endMonth, lang]);

  return { trend, loading };
}
