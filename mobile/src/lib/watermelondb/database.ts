import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { setGenerator } from '@nozbe/watermelondb/utils/common/randomId';
import { schema } from './schema';
import { migrations } from './migrations';
import Category from './models/Category';
import Transaction from './models/Transaction';
import TransactionItem from './models/TransactionItem';
import Budget from './models/Budget';
import RecurringTemplate from './models/RecurringTemplate';

// UUID v4 generator compatible with Supabase UUID columns (no native crypto required)
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
setGenerator(uuidv4);

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  onSetUpError: (error) => {
    console.error('[WDB] Database setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Category, Transaction, TransactionItem, Budget, RecurringTemplate],
});
