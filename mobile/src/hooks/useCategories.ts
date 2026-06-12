import { useEffect, useState, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../lib/watermelondb/database';
import Category from '../lib/watermelondb/models/Category';
import { Category as CategoryType, TransactionType } from '../types';
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
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

  const addCategory = useCallback(
    async (name: string, icon: string, color: string, catType: TransactionType) => {
      if (!user) throw new Error('Not authenticated');
      const now = Date.now();
      await database.write(async () => {
        await database.collections.get<Category>('categories').create((record) => {
          Object.assign(record._raw, {
            name: name.trim(),
            icon,
            color,
            type: catType,
            is_default: false,
            user_id: user.id,
            is_deleted: false,
            created_at: now,
            updated_at: now,
          });
        });
      });
    },
    [user],
  );

  const updateCategory = useCallback(
    async (id: string, name: string, icon: string, color: string) => {
      const now = Date.now();
      await database.write(async () => {
        const cat = await database.collections.get<Category>('categories').find(id);
        await cat.update(() => {
          (cat._raw as any).name = name.trim();
          (cat._raw as any).icon = icon;
          (cat._raw as any).color = color;
          (cat._raw as any).updated_at = now;
        });
      });
    },
    [],
  );

  const deleteCategory = useCallback(async (id: string) => {
    await database.write(async () => {
      const cat = await database.collections.get<Category>('categories').find(id);
      await cat.markAsDeleted();
    });
  }, []);

  return { categories, loading, addCategory, updateCategory, deleteCategory };
}
