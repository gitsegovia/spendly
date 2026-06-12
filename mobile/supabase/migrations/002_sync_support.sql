-- ============================================================
-- Spendly — Migración 002: soporte WatermelonDB sync
-- Ejecutar en: Supabase SQL Editor (spendly-dev)
-- ============================================================

-- 1. onboarding_completed en profiles (si no existe)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- 2. is_deleted para soft-delete (requerido por WatermelonDB sync protocol)
ALTER TABLE public.categories       ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.transactions     ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.transaction_items ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

-- 3. Trigger auto-update de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS transactions_updated_at ON public.transactions;
CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS transaction_items_updated_at ON public.transaction_items;
CREATE TRIGGER transaction_items_updated_at
  BEFORE UPDATE ON public.transaction_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Índices adicionales para sync eficiente
CREATE INDEX IF NOT EXISTS idx_categories_updated_at       ON public.categories(updated_at);
CREATE INDEX IF NOT EXISTS idx_transactions_updated_at     ON public.transactions(updated_at);
CREATE INDEX IF NOT EXISTS idx_transaction_items_updated_at ON public.transaction_items(updated_at);
