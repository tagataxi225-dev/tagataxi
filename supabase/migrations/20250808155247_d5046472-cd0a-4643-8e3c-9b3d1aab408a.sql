
-- 1) Garantir une clé unique sur profiles.user_id (si manquante)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'u'
      AND conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END$$;

-- 2) Clés étrangères attendues par le code (pour activer les joins PostgREST)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'driver_credits_driver_id_fkey'
  ) THEN
    ALTER TABLE public.driver_credits
      ADD CONSTRAINT driver_credits_driver_id_fkey
      FOREIGN KEY (driver_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'credit_transactions_driver_id_fkey'
  ) THEN
    ALTER TABLE public.credit_transactions
      ADD CONSTRAINT credit_transactions_driver_id_fkey
      FOREIGN KEY (driver_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END$$;

-- 3) Index pour de meilleures performances
CREATE INDEX IF NOT EXISTS idx_driver_credits_driver_id
  ON public.driver_credits (driver_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_driver_id
  ON public.credit_transactions (driver_id);

-- 4) Politiques RLS pour accès admin/finance
-- driver_credits: conserver la politique existante "Drivers can view their own credits"
-- et ajouter une politique pour les rôles finance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'driver_credits'
      AND policyname = 'Finance can view all driver credits'
  ) THEN
    CREATE POLICY "Finance can view all driver credits"
      ON public.driver_credits
      FOR SELECT
      TO authenticated
      USING (
        public.has_permission(auth.uid(), 'finance_read')
        OR public.has_permission(auth.uid(), 'finance_write')
        OR public.has_permission(auth.uid(), 'finance_admin')
      );
  END IF;
END$$;

-- credit_transactions: conserver "Drivers can view their own transactions"
-- et ajouter une politique pour les rôles finance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'credit_transactions'
      AND policyname = 'Finance can view all credit transactions'
  ) THEN
    CREATE POLICY "Finance can view all credit transactions"
      ON public.credit_transactions
      FOR SELECT
      TO authenticated
      USING (
        public.has_permission(auth.uid(), 'finance_read')
        OR public.has_permission(auth.uid(), 'finance_write')
        OR public.has_permission(auth.uid(), 'finance_admin')
      );
  END IF;
END$$;
