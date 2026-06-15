import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../lib/watermelondb/database';
import TransactionModel from '../lib/watermelondb/models/Transaction';
import CategoryModel from '../lib/watermelondb/models/Category';
import { TransactionType } from '../types';

export interface RecentTransaction {
  id: string;
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  type: TransactionType;
  amount: number;
  date: string;
  notes: string;
}

export function useRecentTransactions(year: number, month: number, limit = 5) {
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  useEffect(() => {
    const sub = database.collections
      .get<TransactionModel>('transactions')
      .query(
        Q.where('is_deleted', false),
        Q.where('date', Q.gte(startDate)),
        Q.where('date', Q.lte(endDate)),
      )
      .observe()
      .subscribe(async (txRecords) => {
        if (txRecords.length === 0) {
          setTransactions([]);
          setLoading(false);
          return;
        }

        const sorted = [...txRecords].sort((a, b) => {
          const d = b.date.localeCompare(a.date);
          if (d !== 0) return d;
          return ((b._raw as any).created_at as number) - ((a._raw as any).created_at as number);
        });
        const recent = sorted.slice(0, limit);

        const catIds = [...new Set(recent.map(t => t.categoryId))];
        const cats = await database.collections
          .get<CategoryModel>('categories')
          .query(Q.where('id', Q.oneOf(catIds)))
          .fetch();
        const catMap = new Map(cats.map(c => [c.id, c]));

        setTransactions(
          recent.map(tx => {
            const cat = catMap.get(tx.categoryId);
            return {
              id: tx.id,
              category_id: tx.categoryId,
              category_name: cat?.name ?? '',
              category_color: cat?.color ?? '#6B7280',
              category_icon: cat?.icon ?? '',
              type: tx.type as TransactionType,
              amount: tx.amount,
              date: tx.date,
              notes: tx.notes ?? '',
            };
          })
        );
        setLoading(false);
      });

    return () => sub.unsubscribe();
  }, [startDate, endDate, limit]);

  return { transactions, loading };
}
