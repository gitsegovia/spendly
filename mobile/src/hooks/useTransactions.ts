import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { Transaction, TransactionItem, TransactionType } from '../types';
import { useAuth } from '../contexts/AuthContext';

export interface TransactionWithItems extends Transaction {
  items: TransactionItem[];
  category_name?: string;
  category_color?: string;
  category_icon?: string;
}

export function useTransactions(type: TransactionType, year: number, month: number) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TransactionWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('transactions')
      .select(`*, transaction_items(*), categories(name, color, icon)`)
      .eq('user_id', user.id)
      .eq('type', type)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    const mapped = (data ?? []).map((t: any) => ({
      ...t,
      items: t.transaction_items ?? [],
      category_name: t.categories?.name,
      category_color: t.categories?.color,
      category_icon: t.categories?.icon,
    }));
    setTransactions(mapped);
    setLoading(false);
  }, [user, type, startDate, endDate]);

  useEffect(() => { fetch(); }, [fetch]);

  async function addTransaction(
    categoryId: string,
    amount: number,
    date: string,
    notes: string,
    items: { name: string; amount: number; quantity: number }[]
  ) {
    if (!user) return;
    const { data: tx, error } = await supabase
      .from('transactions')
      .insert({ user_id: user.id, category_id: categoryId, type, amount, date, notes })
      .select()
      .single();
    if (error || !tx) throw error;

    if (items.length > 0) {
      await supabase.from('transaction_items').insert(
        items.map((i) => ({ transaction_id: tx.id, ...i }))
      );
    }
    await fetch();
  }

  async function deleteTransaction(id: string) {
    await supabase.from('transactions').delete().eq('id', id);
    await fetch();
  }

  return { transactions, loading, addTransaction, deleteTransaction, refresh: fetch };
}
