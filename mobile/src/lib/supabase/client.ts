import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { SecureStoreAdapter } from './storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Todas las llamadas de red de Supabase (incluyendo token refresh) tienen máx 8s.
// Sin este timeout, _recoverAndRefresh() puede colgar indefinidamente en restart.
const fetchWithTimeout = (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    console.warn('[Supabase] fetch timeout — abortando request');
    controller.abort();
  }, 8000);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: fetchWithTimeout,
  },
});
