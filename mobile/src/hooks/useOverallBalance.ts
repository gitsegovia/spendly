import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../lib/watermelondb/database';
import TransactionModel from '../lib/watermelondb/models/Transaction';

export interface OverallBalance {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  /** Ingresos − gastos históricos (el ahorro sigue siendo patrimonio propio) */
  balance: number;
  /** Balance − ahorro apartado: lo que queda disponible */
  available: number;
}

/**
 * Balance general histórico del usuario (todas las transacciones).
 */
export function useOverallBalance() {
  const [data, setData] = useState<OverallBalance>({
    totalIncome: 0, totalExpenses: 0, totalSavings: 0, balance: 0, available: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = database.collections
      .get<TransactionModel>('transactions')
      .query(Q.where('is_deleted', false))
      .observe()
      .subscribe((records) => {
        let totalIncome = 0;
        let totalExpenses = 0;
        let totalSavings = 0;
        for (const tx of records) {
          if (tx.type === 'income') totalIncome += tx.amount;
          else if (tx.type === 'saving') totalSavings += tx.amount;
          else totalExpenses += tx.amount;
        }
        const balance = totalIncome - totalExpenses;
        setData({
          totalIncome,
          totalExpenses,
          totalSavings,
          balance,
          available: balance - totalSavings,
        });
        setLoading(false);
      });
    return () => sub.unsubscribe();
  }, []);

  return { ...data, loading };
}
