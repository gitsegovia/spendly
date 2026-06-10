-- ============================================================
-- Spendly — Migración inicial
-- Ejecutar en: Supabase SQL Editor (spendly-dev)
-- ============================================================

-- ============================================================
-- 1. PROFILES
-- Extiende auth.users con datos de la app
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  currency TEXT NOT NULL DEFAULT 'USD',
  language TEXT NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'tag',
  color TEXT NOT NULL DEFAULT '#6B7280',
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. TRANSACTION ITEMS
-- Detalle de artículos dentro de una transacción
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  quantity NUMERIC(8, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. SUBSCRIPTIONS
-- Estado del plan sincronizado desde RevenueCat via webhook
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  provider TEXT CHECK (provider IN ('apple', 'google')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON public.transaction_items(transaction_id);

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- Cada usuario solo puede ver y modificar sus propios datos
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles: usuario ve solo el suyo"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: usuario actualiza solo el suyo"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories
CREATE POLICY "categories: usuario ve solo las suyas"
  ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "categories: usuario crea las suyas"
  ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories: usuario actualiza las suyas"
  ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "categories: usuario elimina las suyas"
  ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "transactions: usuario ve solo las suyas"
  ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions: usuario crea las suyas"
  ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions: usuario actualiza las suyas"
  ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transactions: usuario elimina las suyas"
  ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Transaction Items (acceso via transacción del usuario)
CREATE POLICY "transaction_items: usuario ve los suyos"
  ON public.transaction_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transaction_id AND t.user_id = auth.uid()
    )
  );
CREATE POLICY "transaction_items: usuario crea los suyos"
  ON public.transaction_items FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transaction_id AND t.user_id = auth.uid()
    )
  );
CREATE POLICY "transaction_items: usuario actualiza los suyos"
  ON public.transaction_items FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transaction_id AND t.user_id = auth.uid()
    )
  );
CREATE POLICY "transaction_items: usuario elimina los suyos"
  ON public.transaction_items FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transaction_id AND t.user_id = auth.uid()
    )
  );

-- Subscriptions
CREATE POLICY "subscriptions: usuario ve solo la suya"
  ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- 8. TRIGGER: auto-crear profile al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, currency, language)
  VALUES (NEW.id, 'USD', 'es');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 9. FUNCIÓN: seed categorías por defecto al crear perfil
-- Se llama desde la app después del primer login
-- ============================================================
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, icon, color, type, is_default) VALUES
    -- Gastos
    (p_user_id, 'Comida',          'utensils',      '#EF4444', 'expense', true),
    (p_user_id, 'Servicios',       'zap',           '#F59E0B', 'expense', true),
    (p_user_id, 'Educación',       'book-open',     '#8B5CF6', 'expense', true),
    (p_user_id, 'Transporte',      'car',           '#3B82F6', 'expense', true),
    (p_user_id, 'Salud',           'heart',         '#EC4899', 'expense', true),
    (p_user_id, 'Entretenimiento', 'tv',            '#06B6D4', 'expense', true),
    (p_user_id, 'Otro',            'more-horizontal','#6B7280', 'expense', true),
    -- Ingresos
    (p_user_id, 'Salario',         'briefcase',     '#10B981', 'income',  true),
    (p_user_id, 'Freelance',       'monitor',       '#059669', 'income',  true),
    (p_user_id, 'Otro ingreso',    'plus-circle',   '#6B7280', 'income',  true);
END;
$$;
