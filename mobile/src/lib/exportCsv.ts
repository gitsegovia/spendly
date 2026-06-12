import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Q } from '@nozbe/watermelondb';
import { database } from './watermelondb/database';
import TransactionModel from './watermelondb/models/Transaction';
import TransactionItemModel from './watermelondb/models/TransactionItem';
import CategoryModel from './watermelondb/models/Category';

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportTransactionsCsv(currency: string): Promise<void> {
  const [txRecords, catRecords] = await Promise.all([
    database.collections
      .get<TransactionModel>('transactions')
      .query(Q.where('is_deleted', false))
      .fetch(),
    database.collections
      .get<CategoryModel>('categories')
      .query(Q.where('is_deleted', false))
      .fetch(),
  ]);

  const catMap = new Map(catRecords.map(c => [c.id, c.name]));

  // Fetch items for all transactions
  const txIds = txRecords.map(t => t.id);
  const itemRecords = txIds.length > 0
    ? await database.collections
        .get<TransactionItemModel>('transaction_items')
        .query(Q.where('is_deleted', false), Q.where('transaction_id', Q.oneOf(txIds)))
        .fetch()
    : [];

  const itemsByTx = new Map<string, string>();
  for (const item of itemRecords) {
    const existing = itemsByTx.get(item.transactionId) ?? '';
    const entry = `${item.name} x${item.quantity} (${item.amount.toFixed(2)})`;
    itemsByTx.set(item.transactionId, existing ? `${existing}; ${entry}` : entry);
  }

  const header = 'Date,Type,Category,Amount,Currency,Notes,Items\n';

  const rows = txRecords
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(t => {
      const catName = escapeCsv(catMap.get(t.categoryId) ?? '');
      const notes = escapeCsv(t.notes ?? '');
      const items = escapeCsv(itemsByTx.get(t.id) ?? '');
      return [t.date, t.type, catName, t.amount.toFixed(2), currency, notes, items].join(',');
    })
    .join('\n');

  const csv = header + rows;
  const fileName = `spendly_${new Date().toISOString().split('T')[0]}.csv`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing not available on this device');

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Spendly — Export CSV',
    UTI: 'public.comma-separated-values-text',
  });
}
