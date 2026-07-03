import { useEffect, useMemo, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../lib/watermelondb/database';
import TransactionModel from '../lib/watermelondb/models/Transaction';
import CategoryModel from '../lib/watermelondb/models/Category';
import { useRecurring, RecurringTemplate } from './useRecurring';

export interface PlanVsReal {
  template: RecurringTemplate;
  category_name: string;
  category_color: string;
  category_icon: string;
  /** Real acumulado del mes actual (transacciones vinculadas a la plantilla) */
  actual: number;
  /** Promedio de los últimos 3 meses cerrados, null si no hay datos */
  avg3m: number | null;
}

export interface Projection {
  income: number;
  expenses: number;
  savings: number;
  balance: number;
}

function monthKey(date: string): string {
  return date.slice(0, 7); // 'YYYY-MM'
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Proyección del próximo mes (suma de plantillas activas) y comparación
 * plan vs real del mes actual por plantilla recurrente.
 */
export function useProjection() {
  const { templates, loading: templatesLoading } = useRecurring();
  const [linkedTx, setLinkedTx] = useState<TransactionModel[]>([]);
  const [categories, setCategories] = useState<Map<string, CategoryModel>>(new Map());
  const [txLoading, setTxLoading] = useState(true);

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const currentKey = `${curYear}-${pad(curMonth)}`;

  // Ventana: desde el inicio de hace 3 meses hasta hoy (para promedio 3m + mes actual)
  const windowStart = useMemo(() => {
    const d = new Date(curYear, curMonth - 1 - 3, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
  }, [curYear, curMonth]);

  useEffect(() => {
    const sub = database.collections
      .get<TransactionModel>('transactions')
      .query(
        Q.where('is_deleted', false),
        Q.where('recurring_id', Q.notEq(null)),
        Q.where('date', Q.gte(windowStart)),
      )
      .observe()
      .subscribe(async (records) => {
        setLinkedTx(records);
        setTxLoading(false);
      });
    return () => sub.unsubscribe();
  }, [windowStart]);

  useEffect(() => {
    const sub = database.collections
      .get<CategoryModel>('categories')
      .query(Q.where('is_deleted', false))
      .observe()
      .subscribe((records) => {
        setCategories(new Map(records.map((c) => [c.id, c])));
      });
    return () => sub.unsubscribe();
  }, []);

  const active = useMemo(
    () => templates.filter((tp) => tp.is_active),
    [templates],
  );

  // Proyección del próximo mes: suma de estimados activos
  const projection: Projection = useMemo(() => {
    let income = 0;
    let expenses = 0;
    let savings = 0;
    for (const tp of active) {
      if (tp.type === 'income') income += tp.amount;
      else if (tp.type === 'expense') expenses += tp.amount;
      else savings += tp.amount;
    }
    return { income, expenses, savings, balance: income - expenses - savings };
  }, [active]);

  // Plan vs real del mes actual + promedio de los 3 meses cerrados anteriores
  const planVsReal: PlanVsReal[] = useMemo(() => {
    const currentByTemplate = new Map<string, number>();
    const pastByTemplate = new Map<string, Map<string, number>>();

    for (const tx of linkedTx) {
      const rid = tx.recurringId;
      if (!rid) continue;
      const key = monthKey(tx.date);
      if (key === currentKey) {
        currentByTemplate.set(rid, (currentByTemplate.get(rid) ?? 0) + tx.amount);
      } else {
        const months = pastByTemplate.get(rid) ?? new Map<string, number>();
        months.set(key, (months.get(key) ?? 0) + tx.amount);
        pastByTemplate.set(rid, months);
      }
    }

    return active.map((tp) => {
      const cat = categories.get(tp.category_id);
      const past = pastByTemplate.get(tp.id);
      const avg3m = past && past.size > 0
        ? [...past.values()].reduce((a, b) => a + b, 0) / past.size
        : null;
      return {
        template: tp,
        category_name: cat?.name ?? '',
        category_color: cat?.color ?? '#9CA3AF',
        category_icon: cat?.icon ?? '',
        actual: currentByTemplate.get(tp.id) ?? 0,
        avg3m,
      };
    });
  }, [active, linkedTx, categories, currentKey]);

  return {
    templates,
    activeTemplates: active,
    projection,
    planVsReal,
    loading: templatesLoading || txLoading,
  };
}
