import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client';
import { Category, TransactionType } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function useCategories(type?: TransactionType) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let query = supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('name');

    if (type) query = query.eq('type', type);

    query.then(({ data }) => {
      setCategories((data as Category[]) ?? []);
      setLoading(false);
    });
  }, [user, type]);

  return { categories, loading };
}
