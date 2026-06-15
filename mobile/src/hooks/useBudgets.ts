import { useEffect, useState, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../lib/watermelondb/database';
import BudgetModel from '../lib/watermelondb/models/Budget';

export interface Budget {
  id: string;
  category_id: string;
  amount: number;
}

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = database.collections
      .get<BudgetModel>('budgets')
      .query(Q.where('is_deleted', false))
      .observe()
      .subscribe((records) => {
        setBudgets(records.map((r) => ({
          id: r.id,
          category_id: r.categoryId,
          amount: r.amount,
        })));
        setLoading(false);
      });

    return () => sub.unsubscribe();
  }, []);

  const setBudget = useCallback(async (categoryId: string, amount: number, userId: string) => {
    const collection = database.collections.get<BudgetModel>('budgets');
    const existing = await collection
      .query(Q.where('category_id', categoryId), Q.where('is_deleted', false))
      .fetch();

    const now = Date.now();

    if (existing.length > 0) {
      await database.write(async () => {
        await existing[0].update((r: any) => {
          r._setRaw('amount', amount);
          r._setRaw('updated_at', now);
        });
      });
    } else {
      await database.write(async () => {
        await collection.create((r: any) => {
          r._setRaw('category_id', categoryId);
          r._setRaw('amount', amount);
          r._setRaw('user_id', userId);
          r._setRaw('is_deleted', false);
          r._setRaw('created_at', now);
          r._setRaw('updated_at', now);
        });
      });
    }
  }, []);

  const deleteBudget = useCallback(async (categoryId: string) => {
    const collection = database.collections.get<BudgetModel>('budgets');
    const existing = await collection
      .query(Q.where('category_id', categoryId), Q.where('is_deleted', false))
      .fetch();

    if (existing.length > 0) {
      const now = Date.now();
      await database.write(async () => {
        await existing[0].update((r: any) => {
          r._setRaw('is_deleted', true);
          r._setRaw('updated_at', now);
        });
      });
    }
  }, []);

  const getBudgetForCategory = useCallback((categoryId: string): number | null => {
    const found = budgets.find((b) => b.category_id === categoryId);
    return found ? found.amount : null;
  }, [budgets]);

  return { budgets, loading, setBudget, deleteBudget, getBudgetForCategory };
}
