import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../lib/watermelondb/database';
import TransactionModel from '../lib/watermelondb/models/Transaction';
import CategoryModel from '../lib/watermelondb/models/Category';

export interface SavingsByCategory {
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  /** Total acumulado histórico */
  accumulated: number;
  /** Aportado en el mes actual */
  thisMonth: number;
}

/**
 * Acumulado histórico de ahorro (todas las transacciones tipo 'saving')
 * agrupado por categoría de ahorro, más el aporte del mes actual.
 */
export function useSavings() {
  const [byCategory, setByCategory] = useState<SavingsByCategory[]>([]);
  const [totalAccumulated, setTotalAccumulated] = useState(0);
  const [totalThisMonth, setTotalThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const sub = database.collections
      .get<TransactionModel>('transactions')
      .query(Q.where('is_deleted', false), Q.where('type', 'saving'))
      .observe()
      .subscribe(async (txRecords) => {
        const catRecords = await database.collections
          .get<CategoryModel>('categories')
          .query(Q.where('is_deleted', false), Q.where('type', 'saving'))
          .fetch();

        const rows = new Map<string, SavingsByCategory>();
        for (const cat of catRecords) {
          rows.set(cat.id, {
            category_id: cat.id,
            category_name: cat.name,
            category_color: cat.color,
            category_icon: cat.icon ?? '',
            accumulated: 0,
            thisMonth: 0,
          });
        }

        let total = 0;
        let totalMonth = 0;
        for (const tx of txRecords) {
          const row = rows.get(tx.categoryId);
          total += tx.amount;
          if (row) row.accumulated += tx.amount;
          if (tx.date.slice(0, 7) === currentKey) {
            totalMonth += tx.amount;
            if (row) row.thisMonth += tx.amount;
          }
        }

        setByCategory([...rows.values()].sort((a, b) => b.accumulated - a.accumulated));
        setTotalAccumulated(total);
        setTotalThisMonth(totalMonth);
        setLoading(false);
      });

    return () => sub.unsubscribe();
  }, []);

  return { byCategory, totalAccumulated, totalThisMonth, loading };
}
