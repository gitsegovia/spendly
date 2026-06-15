import { schemaMigrations, createTable } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
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
