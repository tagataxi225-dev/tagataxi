-- ========================================
-- PHASE 1 & 3 : RPC OPTIMISÉES POUR ADMIN ET ABONNEMENTS
-- ========================================

-- RPC ultra-rapide pour vérification admin (évite les timeouts)
CREATE OR REPLACE FUNCTION public.verify_admin_fast(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'is_admin', EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = p_user_id 
        AND role = 'admin'::user_role
        AND is_active = true
    ),
    'admin_role', (
      SELECT admin_role::text FROM public.user_roles 
      WHERE user_id = p_user_id 
        AND role = 'admin'::user_role
        AND is_active = true
      LIMIT 1
    ),
    'user_id', p_user_id
  );
$$;

-- Supprimer l'ancienne fonction et la recréer avec le bon type de retour
DROP FUNCTION IF EXISTS public.get_admin_subscriptions_unified();

CREATE FUNCTION public.get_admin_subscriptions_unified()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  driver_subs jsonb;
  rental_subs jsonb;
  driver_count integer;
  rental_count integer;
  driver_revenue numeric;
  rental_revenue numeric;
  driver_expiring integer;
  rental_expiring integer;
BEGIN
  -- Vérifier admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role = 'admin'::user_role 
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Abonnements chauffeurs avec données enrichies
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'id', ds.id,
        'driver_id', ds.driver_id,
        'driver_name', c.display_name,
        'driver_phone', c.phone_number,
        'plan_id', ds.plan_id,
        'plan_name', sp.name,
        'monthly_fee', sp.monthly_fee,
        'status', ds.status,
        'start_date', ds.start_date,
        'end_date', ds.end_date,
        'auto_renew', ds.auto_renew,
        'rides_remaining', ds.rides_remaining,
        'created_at', ds.created_at,
        'type', 'driver'
      )
    ),
    COUNT(*),
    COALESCE(SUM(sp.monthly_fee), 0),
    COUNT(*) FILTER (WHERE ds.end_date <= now() + interval '7 days' AND ds.status = 'active')
  INTO driver_subs, driver_count, driver_revenue, driver_expiring
  FROM public.driver_subscriptions ds
  LEFT JOIN public.chauffeurs c ON ds.driver_id = c.user_id
  LEFT JOIN public.subscription_plans sp ON ds.plan_id = sp.id
  WHERE ds.status IN ('active', 'pending');

  -- Abonnements location avec données enrichies
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'id', prs.id,
        'partner_id', prs.partner_id,
        'partner_name', p.company_name,
        'partner_phone', p.phone_number,
        'plan_id', prs.plan_id,
        'plan_name', rsp.name,
        'monthly_fee', rsp.monthly_fee,
        'status', prs.status,
        'start_date', prs.start_date,
        'end_date', prs.end_date,
        'auto_renew', prs.auto_renew,
        'vehicles_limit', rsp.vehicle_limit,
        'created_at', prs.created_at,
        'type', 'rental'
      )
    ),
    COUNT(*),
    COALESCE(SUM(rsp.monthly_fee), 0),
    COUNT(*) FILTER (WHERE prs.end_date <= now() + interval '7 days' AND prs.status = 'active')
  INTO rental_subs, rental_count, rental_revenue, rental_expiring
  FROM public.partner_rental_subscriptions prs
  LEFT JOIN public.partenaires p ON prs.partner_id = p.id
  LEFT JOIN public.rental_subscription_plans rsp ON prs.plan_id = rsp.id
  WHERE prs.status IN ('active', 'pending');

  -- Retourner tout en un seul appel
  RETURN jsonb_build_object(
    'driver_subscriptions', COALESCE(driver_subs, '[]'::jsonb),
    'rental_subscriptions', COALESCE(rental_subs, '[]'::jsonb),
    'stats', jsonb_build_object(
      'driver_count', COALESCE(driver_count, 0),
      'rental_count', COALESCE(rental_count, 0),
      'total_revenue', COALESCE(driver_revenue + rental_revenue, 0),
      'driver_revenue', COALESCE(driver_revenue, 0),
      'rental_revenue', COALESCE(rental_revenue, 0),
      'driver_expiring', COALESCE(driver_expiring, 0),
      'rental_expiring', COALESCE(rental_expiring, 0),
      'total_active', COALESCE(driver_count, 0) + COALESCE(rental_count, 0),
      'total_expiring', COALESCE(driver_expiring, 0) + COALESCE(rental_expiring, 0)
    ),
    'success', true
  );
END;
$$;

-- ========================================
-- PHASE 5 : INDEX POUR OPTIMISATION
-- ========================================

-- Index pour vérification admin ultra-rapide
CREATE INDEX IF NOT EXISTS idx_user_roles_admin_check 
ON public.user_roles(user_id, role, is_active) 
WHERE role = 'admin';

-- Index pour driver_subscriptions (requêtes rapides)
CREATE INDEX IF NOT EXISTS idx_driver_subscriptions_active_status 
ON public.driver_subscriptions(status, end_date, created_at) 
WHERE status IN ('active', 'pending');

-- Index pour partner_rental_subscriptions (requêtes rapides)
CREATE INDEX IF NOT EXISTS idx_rental_subscriptions_active_status 
ON public.partner_rental_subscriptions(status, end_date, created_at) 
WHERE status IN ('active', 'pending');

-- Index pour chauffeurs (jointures rapides)
CREATE INDEX IF NOT EXISTS idx_chauffeurs_user_id_active 
ON public.chauffeurs(user_id, is_active) 
WHERE is_active = true;

-- Index pour partenaires (jointures rapides)
CREATE INDEX IF NOT EXISTS idx_partenaires_id_active 
ON public.partenaires(id, is_active) 
WHERE is_active = true;