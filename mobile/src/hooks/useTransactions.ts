import { useEffect, useState, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../lib/watermelondb/database';
import TransactionModel from '../lib/watermelondb/models/Transaction';
import TransactionItemModel from '../lib/watermelondb/models/TransactionItem';
import CategoryModel from '../lib/watermelondb/models/Category';
import RecurringTemplateModel from '../lib/watermelondb/models/RecurringTemplate';
import { findActiveTemplate } from './useRecurring';
import { Transaction, TransactionItem, TransactionType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useFreemium } from './useFreemium';

export interface TransactionWithItems extends Transaction {
  items: TransactionItem[];
  category_name?: string;
  category_color?: string;
  category_icon?: string;
}

export function useTransactions(type: TransactionType, year: number, month: number) {
  const { user } = useAuth();
  const { isMonthLocked } = useFreemium();
  const [transactions, setTransactions] = useState<TransactionWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const locked = isMonthLocked(year, month);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  // Construir la fecha en local — toISOString() convierte a UTC y en zonas UTC+
  // el último día del mes quedaría excluido del rango
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  useEffect(() => {
    if (locked) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const subscription = database.collections
      .get<TransactionModel>('transactions')
      .query(
        Q.where('is_deleted', false),
        Q.where('type', type),
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

        const txIds = txRecords.map((t) => t.id);

        const [itemRecords, catRecords] = await Promise.all([
          database.collections
            .get<TransactionItemModel>('transaction_items')
            .query(Q.where('is_deleted', false), Q.where('transaction_id', Q.oneOf(txIds)))
            .fetch(),
          database.collections
            .get<CategoryModel>('categories')
            .query(Q.where('is_deleted', false))
            .fetch(),
        ]);

        const catMap = new Map(catRecords.map((c) => [c.id, c]));
        const itemsByTx = new Map<string, TransactionItem[]>();
        for (const item of itemRecords) {
          const list = itemsByTx.get(item.transactionId) ?? [];
          list.push({
            id: item.id,
            transaction_id: item.transactionId,
            name: item.name,
            amount: item.amount,
            quantity: item.quantity,
            created_at: item.createdAt?.toISOString() ?? '',
            updated_at: item.updatedAt?.toISOString() ?? '',
          });
          itemsByTx.set(item.transactionId, list);
        }

        const result: TransactionWithItems[] = txRecords
          .map((t) => {
            const cat = catMap.get(t.categoryId);
            return {
              id: t.id,
              user_id: t.userId,
              category_id: t.categoryId,
              type: t.type as TransactionType,
              amount: t.amount,
              date: t.date,
              notes: t.notes,
              created_at: t.createdAt?.toISOString() ?? '',
              updated_at: t.updatedAt?.toISOString() ?? '',
              items: itemsByTx.get(t.id) ?? [],
              category_name: cat?.name,
              category_color: cat?.color,
              category_icon: cat?.icon,
            };
          })
          .sort((a, b) => b.date.localeCompare(a.date));

        setTransactions(result);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [type, startDate, endDate, locked]);

  const addTransaction = useCallback(
    async (
      categoryId: string,
      amount: number,
      date: string,
      notes: string,
      items: { name: string; amount: number; quantity: number }[],
      recurring = false,
    ) => {
      if (!user) return;
      const now = Date.now();

      // Si ya hay una plantilla recurrente activa para esta categoría+tipo,
      // la transacción se vincula automáticamente (plan vs real)
      const existingTemplate = await findActiveTemplate(categoryId, type);

      await database.write(async () => {
        let recurringId = existingTemplate?.id ?? null;

        // El usuario marcó "repetir cada mes" y no había plantilla: crearla
        if (!recurringId && recurring) {
          const template = await database.collections
            .get<RecurringTemplateModel>('recurring_templates')
            .create((record) => {
              Object.assign(record._raw, {
                category_id: categoryId,
                type,
                amount,
                day_of_month: Number(date.slice(8, 10)) || 1,
                notes: '',
                is_active: true,
                user_id: user.id,
                is_deleted: false,
                created_at: now,
                updated_at: now,
              });
            });
          recurringId = template.id;
        }

        const tx = await database.collections.get<TransactionModel>('transactions').create((record) => {
          Object.assign(record._raw, {
            category_id: categoryId,
            type,
            amount,
            date,
            notes: notes ?? '',
            recurring_id: recurringId,
            user_id: user.id,
            is_deleted: false,
            created_at: now,
            updated_at: now,
          });
        });

        for (const item of items) {
          await database.collections.get<TransactionItemModel>('transaction_items').create((record) => {
            Object.assign(record._raw, {
              transaction_id: tx.id,
              name: item.name,
              amount: item.amount,
              quantity: item.quantity,
              is_deleted: false,
              created_at: now,
              updated_at: now,
            });
          });
        }
      });
    },
    [user, type],
  );

  const deleteTransaction = useCallback(async (id: string) => {
    await database.write(async () => {
      const txCollection = database.collections.get<TransactionModel>('transactions');
      const itemCollection = database.collections.get<TransactionItemModel>('transaction_items');

      const tx = await txCollection.find(id);
      const items = await itemCollection
        .query(Q.where('transaction_id', id))
        .fetch();

      await Promise.all([
        tx.markAsDeleted(),
        ...items.map((item) => item.markAsDeleted()),
      ]);
    });
  }, []);

  const updateTransaction = useCallback(
    async (
      id: string,
      categoryId: string,
      amount: number,
      date: string,
      notes: string,
      items: { name: string; amount: number; quantity: number }[],
    ) => {
      const now = Date.now();
      await database.write(async () => {
        const txCollection = database.collections.get<TransactionModel>('transactions');
        const itemCollection = database.collections.get<TransactionItemModel>('transaction_items');

        const tx = await txCollection.find(id);
        await tx.update((record) => {
          Object.assign(record._raw, {
            category_id: categoryId,
            amount,
            date,
            notes: notes ?? '',
            updated_at: now,
          });
        });

        // Eliminar items anteriores
        const oldItems = await itemCollection
          .query(Q.where('transaction_id', id), Q.where('is_deleted', false))
          .fetch();
        await Promise.all(oldItems.map((i) => i.markAsDeleted()));

        // Crear los nuevos items
        for (const item of items) {
          await itemCollection.create((record) => {
            Object.assign(record._raw, {
              transaction_id: id,
              name: item.name,
              amount: item.amount,
              quantity: item.quantity,
              is_deleted: false,
              created_at: now,
              updated_at: now,
            });
          });
        }
      });
    },
    [],
  );

  return { transactions, loading, addTransaction, updateTransaction, deleteTransaction, refresh: () => {} };
}
