export type Plan = 'free' | 'premium';
export type Language = 'es' | 'en';
export type TransactionType = 'expense' | 'income' | 'saving';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type SubscriptionProvider = 'apple' | 'google';

export interface Profile {
  id: string;
  plan: Plan;
  currency: string;
  language: Language;
  onboarding_completed: boolean;
  notification_enabled: boolean;
  notification_hour: number;
  notification_minute: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  name: string;
  amount: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}
