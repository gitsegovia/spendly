import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'categories',
      columns: [
        { name: 'remote_id', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'icon', type: 'string' },
        { name: 'color', type: 'string' },
        { name: 'type', type: 'string' }, // 'expense' | 'income'
        { name: 'is_default', type: 'boolean' },
        { name: 'synced_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'remote_id', type: 'string', isOptional: true },
        { name: 'category_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' }, // 'expense' | 'income'
        { name: 'amount', type: 'number' },
        { name: 'date', type: 'number' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'synced_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'transaction_items',
      columns: [
        { name: 'remote_id', type: 'string', isOptional: true },
        { name: 'transaction_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'quantity', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
