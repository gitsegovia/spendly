import { useEffect, useState, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../lib/watermelondb/database';
import RecurringTemplateModel from '../lib/watermelondb/models/RecurringTemplate';
import { TransactionType } from '../types';

export interface RecurringTemplate {
  id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  day_of_month: number;
  notes: string;
  is_active: boolean;
}

export function useRecurring() {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = database.collections
      .get<RecurringTemplateModel>('recurring_templates')
      .query(Q.where('is_deleted', false))
      .observe()
      .subscribe((records) => {
        setTemplates(records.map((r) => ({
          id: r.id,
          category_id: r.categoryId,
          type: r.type as TransactionType,
          amount: r.amount,
          day_of_month: r.dayOfMonth,
          notes: r.notes,
          is_active: r.isActive,
        })));
        setLoading(false);
      });

    return () => sub.unsubscribe();
  }, []);

  const addTemplate = useCallback(async (
    userId: string,
    categoryId: string,
    type: TransactionType,
    amount: number,
    dayOfMonth: number,
    notes = '',
  ): Promise<string> => {
    const now = Date.now();
    let id = '';
    await database.write(async () => {
      const record = await database.collections
        .get<RecurringTemplateModel>('recurring_templates')
        .create((r: any) => {
          r._setRaw('category_id', categoryId);
          r._setRaw('type', type);
          r._setRaw('amount', amount);
          r._setRaw('day_of_month', dayOfMonth);
          r._setRaw('notes', notes);
          r._setRaw('is_active', true);
          r._setRaw('user_id', userId);
          r._setRaw('is_deleted', false);
          r._setRaw('created_at', now);
          r._setRaw('updated_at', now);
        });
      id = record.id;
    });
    return id;
  }, []);

  const updateTemplate = useCallback(async (
    id: string,
    fields: Partial<Pick<RecurringTemplate, 'amount' | 'day_of_month' | 'notes' | 'is_active' | 'category_id'>>,
  ) => {
    const now = Date.now();
    await database.write(async () => {
      const record = await database.collections
        .get<RecurringTemplateModel>('recurring_templates')
        .find(id);
      await record.update((r: any) => {
        if (fields.amount !== undefined) r._setRaw('amount', fields.amount);
        if (fields.day_of_month !== undefined) r._setRaw('day_of_month', fields.day_of_month);
        if (fields.notes !== undefined) r._setRaw('notes', fields.notes);
        if (fields.is_active !== undefined) r._setRaw('is_active', fields.is_active);
        if (fields.category_id !== undefined) r._setRaw('category_id', fields.category_id);
        r._setRaw('updated_at', now);
      });
    });
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    await database.write(async () => {
      const record = await database.collections
        .get<RecurringTemplateModel>('recurring_templates')
        .find(id);
      await record.markAsDeleted();
    });
  }, []);

  return { templates, loading, addTemplate, updateTemplate, deleteTemplate };
}

/**
 * Devuelve la plantilla recurrente activa para una categoría+tipo, si existe.
 * Se usa al crear transacciones para auto-vincular recurring_id.
 */
export async function findActiveTemplate(
  categoryId: string,
  type: TransactionType,
): Promise<RecurringTemplateModel | null> {
  const found = await database.collections
    .get<RecurringTemplateModel>('recurring_templates')
    .query(
      Q.where('is_deleted', false),
      Q.where('is_active', true),
      Q.where('category_id', categoryId),
      Q.where('type', type),
    )
    .fetch();
  return found[0] ?? null;
}
