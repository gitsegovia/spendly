import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './database';
import { supabase } from '../supabase/client';

function toMs(isoOrNull: string | null | undefined): number {
  if (!isoOrNull) return 0;
  return new Date(isoOrNull).getTime();
}

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

// Supabase record → WatermelonDB raw record (id stays as UUID)
function mapCategory(r: any) {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    type: r.type,
    is_default: r.is_default,
    user_id: r.user_id,
    is_deleted: r.is_deleted ?? false,
    created_at: toMs(r.created_at),
    updated_at: toMs(r.updated_at),
  };
}

function mapTransaction(r: any) {
  return {
    id: r.id,
    category_id: r.category_id,
    type: r.type,
    amount: Number(r.amount),
    date: r.date,
    notes: r.notes ?? '',
    user_id: r.user_id,
    is_deleted: r.is_deleted ?? false,
    created_at: toMs(r.created_at),
    updated_at: toMs(r.updated_at),
  };
}

function mapItem(r: any) {
  return {
    id: r.id,
    transaction_id: r.transaction_id,
    name: r.name,
    amount: Number(r.amount),
    quantity: Number(r.quantity),
    is_deleted: r.is_deleted ?? false,
    created_at: toMs(r.created_at),
    updated_at: toMs(r.updated_at),
  };
}

function bucketRecords<T extends { is_deleted: boolean; created_at: number }>(
  records: T[],
  isFirstSync: boolean,
  lastPulledAt: number,
): { created: T[]; updated: T[]; deleted: string[] } {
  const created: T[] = [];
  const updated: T[] = [];
  const deleted: string[] = [];

  for (const r of records) {
    if ((r as any).is_deleted) {
      deleted.push((r as any).id);
    } else if (isFirstSync || r.created_at > lastPulledAt) {
      created.push(r);
    } else {
      updated.push(r);
    }
  }

  return { created, updated, deleted };
}

export async function syncWithSupabase(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const userId = user.id;

  await synchronize({
    database,

    pullChanges: async ({ lastPulledAt }) => {
      const isFirstSync = !lastPulledAt;
      const since = lastPulledAt ? toIso(lastPulledAt) : '1970-01-01T00:00:00.000Z';
      const now = Date.now();

      const [catsResult, txsResult, itemsResult] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId)
          .gt('updated_at', since),
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .gt('updated_at', since),
        supabase
          .from('transaction_items')
          .select('*')
          .gt('updated_at', since),
      ]);

      if (catsResult.error) throw catsResult.error;
      if (txsResult.error) throw txsResult.error;
      if (itemsResult.error) throw itemsResult.error;

      const cats = (catsResult.data ?? []).map(mapCategory);
      const txs = (txsResult.data ?? []).map(mapTransaction);
      const items = (itemsResult.data ?? []).map(mapItem);

      return {
        changes: {
          categories: bucketRecords(cats, isFirstSync, lastPulledAt ?? 0),
          transactions: bucketRecords(txs, isFirstSync, lastPulledAt ?? 0),
          transaction_items: bucketRecords(items, isFirstSync, lastPulledAt ?? 0),
        },
        timestamp: now,
      };
    },

    pushChanges: async ({ changes }) => {
      const now = new Date().toISOString();
      const ch = changes as Record<string, { created: any[]; updated: any[]; deleted: string[] }>;

      // --- categories ---
      const cats = ch.categories ?? { created: [], updated: [], deleted: [] };
      if (cats?.created?.length) {
        const { error } = await supabase.from('categories').insert(
          cats.created.map((r) => ({
            id: r.id,
            user_id: userId,
            name: r.name,
            icon: r.icon,
            color: r.color,
            type: r.type,
            is_default: r.is_default,
            created_at: toIso(r.created_at as number),
            updated_at: toIso(r.updated_at as number),
          })),
        );
        if (error) throw error;
      }
      if (cats?.updated?.length) {
        for (const r of cats.updated) {
          const { error } = await supabase.from('categories').update({
            name: r.name,
            icon: r.icon,
            color: r.color,
            type: r.type,
            is_default: r.is_default,
            updated_at: now,
          }).eq('id', r.id);
          if (error) throw error;
        }
      }
      if (cats?.deleted?.length) {
        const { error } = await supabase.from('categories')
          .update({ is_deleted: true, updated_at: now })
          .in('id', cats.deleted);
        if (error) throw error;
      }

      // --- transactions (before items to satisfy FK) ---
      const txs = ch.transactions ?? { created: [], updated: [], deleted: [] };
      if (txs?.created?.length) {
        const { error } = await supabase.from('transactions').insert(
          txs.created.map((r) => ({
            id: r.id,
            user_id: userId,
            category_id: r.category_id,
            type: r.type,
            amount: r.amount,
            date: r.date,
            notes: r.notes || null,
            created_at: toIso(r.created_at as number),
            updated_at: toIso(r.updated_at as number),
          })),
        );
        if (error) throw error;
      }
      if (txs?.updated?.length) {
        for (const r of txs.updated) {
          const { error } = await supabase.from('transactions').update({
            category_id: r.category_id,
            amount: r.amount,
            date: r.date,
            notes: r.notes || null,
            updated_at: now,
          }).eq('id', r.id);
          if (error) throw error;
        }
      }
      if (txs?.deleted?.length) {
        const { error } = await supabase.from('transactions')
          .update({ is_deleted: true, updated_at: now })
          .in('id', txs.deleted);
        if (error) throw error;
      }

      // --- transaction_items ---
      const items = ch.transaction_items ?? { created: [], updated: [], deleted: [] };
      if (items?.created?.length) {
        const { error } = await supabase.from('transaction_items').insert(
          items.created.map((r) => ({
            id: r.id,
            transaction_id: r.transaction_id,
            name: r.name,
            amount: r.amount,
            quantity: r.quantity,
            created_at: toIso(r.created_at as number),
            updated_at: toIso(r.updated_at as number),
          })),
        );
        if (error) throw error;
      }
      if (items?.updated?.length) {
        for (const r of items.updated) {
          const { error } = await supabase.from('transaction_items').update({
            name: r.name,
            amount: r.amount,
            quantity: r.quantity,
            updated_at: now,
          }).eq('id', r.id);
          if (error) throw error;
        }
      }
      if (items?.deleted?.length) {
        const { error } = await supabase.from('transaction_items')
          .update({ is_deleted: true, updated_at: now })
          .in('id', items.deleted);
        if (error) throw error;
      }
    },
  });
}
