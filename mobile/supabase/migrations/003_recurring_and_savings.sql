-- ============================================================
-- Spendly — Migración 003: recurrentes + tipo ahorro
-- Ejecutar en: Supabase SQL Editor (spendly-dev / staging / prod)
-- ============================================================

-- 1. Tabla de plantillas recurrentes
CREATE TABLE IF NOT EXISTS public.recurring_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'saving')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  day_of_month INTEGER NOT NULL DEFAULT 1 CHECK (day_of_month BETWEEN 1 AND 31),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.recurring_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_templates: usuario ve solo las suyas"
  ON public.recurring_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recurring_templates: usuario crea las suyas"
  ON public.recurring_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recurring_templates: usuario actualiza las suyas"
  ON public.recurring_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recurring_templates: usuario elimina las suyas"
  ON public.recurring_templates FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS recurring_templates_updated_at ON public.recurring_templates;
CREATE TRIGGER recurring_templates_updated_at
  BEFORE UPDATE ON public.recurring_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_recurring_templates_user_id    ON public.recurring_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_templates_updated_at ON public.recurring_templates(updated_at);

-- 2. Vínculo transacción → plantilla recurrente (plan vs real)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS recurring_id UUID REFERENCES public.recurring_templates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_recurring_id ON public.transactions(recurring_id);

-- 3. Nuevo tipo 'saving' en categorías y transacciones (módulo de ahorro)
ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_type_check;
ALTER TABLE public.categories
  ADD CONSTRAINT categories_type_check CHECK (type IN ('expense', 'income', 'saving'));

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_type_check CHECK (type IN ('expense', 'income', 'saving'));
