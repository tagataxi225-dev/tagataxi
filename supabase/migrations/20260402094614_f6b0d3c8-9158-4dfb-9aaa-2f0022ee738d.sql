
-- 1. Drop the overly permissive anon SELECT policy on partenaires
-- This policy exposes ALL columns (including email, phone, bank_account_number) to anonymous users
DROP POLICY IF EXISTS "partenaires_anon_active_only" ON public.partenaires;

-- 2. Drop the overly permissive public SELECT policy on vendor_stats_cache
DROP POLICY IF EXISTS "Public can view all vendor stats" ON public.vendor_stats_cache;

-- 3. Replace with authenticated-only policy for vendor_stats_cache
CREATE POLICY "Authenticated can view vendor stats"
  ON public.vendor_stats_cache
  FOR SELECT
  TO authenticated
  USING (true);
