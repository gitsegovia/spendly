import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'categories',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'icon', type: 'string' },
        { name: 'color', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'is_default', type: 'boolean' },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'category_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'date', type: 'string', isIndexed: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'transaction_items',
      columns: [
        { name: 'transaction_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'quantity', type: 'number' },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
