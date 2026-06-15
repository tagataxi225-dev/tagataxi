-- ============================================
-- 🔧 CORRECTION POLICIES RLS - TABLE REFERRALS
-- ============================================

-- 1. Supprimer toutes les anciennes policies conflictuelles
DROP POLICY IF EXISTS "referral_access" ON public.referrals;
DROP POLICY IF EXISTS "referrals_insert" ON public.referrals;
DROP POLICY IF EXISTS "referrals_select" ON public.referrals;
DROP POLICY IF EXISTS "referrals_update" ON public.referrals;

-- 2. Créer des policies RLS propres et optimisées
CREATE POLICY "referrals_select_own"
ON public.referrals
FOR SELECT
TO authenticated
USING (
  auth.uid() = referrer_id OR auth.uid() = referred_id
);

CREATE POLICY "referrals_insert_own"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = referrer_id
);

CREATE POLICY "referrals_update_own"
ON public.referrals
FOR UPDATE
TO authenticated
USING (
  auth.uid() = referrer_id OR is_current_user_admin()
)
WITH CHECK (
  auth.uid() = referrer_id OR is_current_user_admin()
);

CREATE POLICY "referrals_delete_own"
ON public.referrals
FOR DELETE
TO authenticated
USING (
  auth.uid() = referrer_id OR is_current_user_admin()
);

CREATE POLICY "referrals_admin_all"
ON public.referrals
FOR ALL
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- ============================================
-- 🧹 NETTOYAGE DONNÉES DE TEST INVALIDES
-- ============================================

-- Supprimer les données de test des delivery_orders
DELETE FROM public.delivery_orders 
WHERE pickup_location LIKE '%test-%' 
   OR delivery_location LIKE '%test-%';

-- Supprimer les données de test des transport_bookings
DELETE FROM public.transport_bookings 
WHERE pickup_location LIKE '%test-%' 
   OR destination LIKE '%test-%';

-- ============================================
-- 📊 LOG DE L'OPÉRATION
-- ============================================
INSERT INTO public.activity_logs (
  activity_type,
  description,
  metadata
) VALUES (
  'database_cleanup',
  'Correction policies RLS table referrals + nettoyage données de test',
  jsonb_build_object(
    'tables_affected', ARRAY['referrals', 'delivery_orders', 'transport_bookings'],
    'policies_recreated', 5,
    'timestamp', now()
  )
);