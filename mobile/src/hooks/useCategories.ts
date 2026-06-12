import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../lib/watermelondb/database';
import Category from '../lib/watermelondb/models/Category';
import { Category as CategoryType, TransactionType } from '../types';

function toCategory(c: Category): CategoryType {
  return {
    id: c.id,
    user_id: c.userId,
    name: c.name,
    icon: c.icon,
    color: c.color,
    type: c.type as TransactionType,
    is_default: c.isDefault,
    created_at: c.createdAt?.toISOString() ?? '',
    updated_at: c.updatedAt?.toISOString() ?? '',
  };
}

export function useCategories(type?: TransactionType) {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clauses = [Q.where('is_deleted', false)];
    if (type) clauses.push(Q.where('type', type));

    const subscription = database.collections
      .get<Category>('categories')
      .query(...clauses)
      .observe()
      .subscribe((records) => {
        const sorted = records
          .map(toCategory)
          .sort((a, b) => {
            if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
            return a.name.localeCompare(b.name);
          });
        setCategories(sorted);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [type]);

  return { categories, loading };
}
