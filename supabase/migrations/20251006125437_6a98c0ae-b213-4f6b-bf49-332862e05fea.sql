-- ============================================
-- PHASE 1: Correction is_current_user_admin()
-- ============================================

-- Remplacer la fonction pour utiliser user_roles au lieu de admins
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role = 'admin'::user_role
      AND is_active = true
  );
$$;

-- ============================================
-- PHASE 2: Correction get_admin_subscriptions_unified()
-- ============================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.get_admin_subscriptions_unified();

-- Recréer avec la bonne structure
CREATE OR REPLACE FUNCTION public.get_admin_subscriptions_unified()
RETURNS TABLE(
  subscription_id uuid,
  subscription_type text,
  user_id uuid,
  user_name text,
  user_email text,
  plan_id uuid,
  plan_name text,
  plan_price numeric,
  duration_type text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  status text,
  auto_renew boolean,
  rides_remaining integer,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier les droits admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  -- Abonnements chauffeurs
  SELECT 
    ds.id AS subscription_id,
    'driver'::text AS subscription_type,
    ds.driver_id AS user_id,
    COALESCE(c.display_name, c.email) AS user_name,
    c.email AS user_email,
    ds.plan_id,
    sp.name AS plan_name,
    sp.price AS plan_price,
    sp.duration_type AS duration_type,
    ds.start_date,
    ds.end_date,
    ds.status,
    ds.auto_renew,
    ds.rides_remaining,
    ds.created_at
  FROM public.driver_subscriptions ds
  JOIN public.subscription_plans sp ON ds.plan_id = sp.id
  JOIN public.chauffeurs c ON ds.driver_id = c.user_id

  UNION ALL

  -- Abonnements location
  SELECT 
    prs.id AS subscription_id,
    'rental'::text AS subscription_type,
    prs.partner_id AS user_id,
    COALESCE(p.company_name, p.email) AS user_name,
    p.email AS user_email,
    prs.plan_id,
    rsp.name AS plan_name,
    rsp.price AS plan_price,
    rsp.duration_type AS duration_type,
    prs.start_date,
    prs.end_date,
    prs.status,
    prs.auto_renew,
    NULL::integer AS rides_remaining,
    prs.created_at
  FROM public.partner_rental_subscriptions prs
  JOIN public.rental_subscription_plans rsp ON prs.plan_id = rsp.id
  JOIN public.partenaires p ON prs.partner_id = p.id

  ORDER BY created_at DESC;
END;
$$;

-- ============================================
-- PHASE 3: Initialisation vues matérialisées
-- ============================================

-- Rafraîchir admin_users_cache
REFRESH MATERIALIZED VIEW public.admin_users_cache;

-- Rafraîchir les vues matérialisées de location
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_admin_rental_vehicle_stats;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_admin_rental_booking_stats;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_admin_rental_subscription_stats;