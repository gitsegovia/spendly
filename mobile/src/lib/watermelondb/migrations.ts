import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 4,
      steps: [
        createTable({
          name: 'recurring_templates',
          columns: [
            { name: 'category_id', type: 'string', isIndexed: true },
            { name: 'type', type: 'string' },
            { name: 'amount', type: 'number' },
            { name: 'day_of_month', type: 'number' },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'is_active', type: 'boolean' },
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'is_deleted', type: 'boolean' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        addColumns({
          table: 'transactions',
          columns: [
            { name: 'recurring_id', type: 'string', isOptional: true, isIndexed: true },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        createTable({
          name: 'budgets',
          columns: [
            { name: 'category_id', type: 'string', isIndexed: true },
            { name: 'amount', type: 'number' },
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'is_deleted', type: 'boolean' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
  ],
});
