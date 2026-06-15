-- =========================================
-- CORRECTION DES POLITIQUES RLS POUR LES ABONNEMENTS
-- =========================================

-- 1. Corriger la politique pour driver_subscriptions (accès admin)
DROP POLICY IF EXISTS "admin_access_driver_subscriptions" ON public.driver_subscriptions;
CREATE POLICY "admin_access_driver_subscriptions"
  ON public.driver_subscriptions
  FOR SELECT
  USING (
    is_current_user_admin() OR
    auth.uid() = driver_id
  );

-- 2. Corriger la politique pour partner_rental_subscriptions (accès admin)
DROP POLICY IF EXISTS "admin_access_rental_subscriptions" ON public.partner_rental_subscriptions;
CREATE POLICY "admin_access_rental_subscriptions"
  ON public.partner_rental_subscriptions
  FOR SELECT
  USING (
    is_current_user_admin() OR
    auth.uid() IN (
      SELECT user_id FROM public.partenaires WHERE id = partner_id
    )
  );

-- 3. S'assurer que subscription_plans est accessible en lecture
DROP POLICY IF EXISTS "subscription_plans_read_access" ON public.subscription_plans;
CREATE POLICY "subscription_plans_read_access"
  ON public.subscription_plans
  FOR SELECT
  USING (
    is_active = true OR is_current_user_admin()
  );

-- 4. Drop et recréer la fonction RPC avec le nouveau type de retour
DROP FUNCTION IF EXISTS public.get_admin_subscriptions_unified();

CREATE OR REPLACE FUNCTION public.get_admin_subscriptions_unified()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  driver_subs jsonb;
  rental_subs jsonb;
  total_active integer;
  monthly_revenue numeric;
BEGIN
  -- Vérifier les permissions admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Récupérer les abonnements chauffeurs avec leurs détails
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ds.id,
      'driver_id', ds.driver_id,
      'plan_id', ds.plan_id,
      'status', ds.status,
      'start_date', ds.start_date,
      'end_date', ds.end_date,
      'rides_remaining', ds.rides_remaining,
      'auto_renew', ds.auto_renew,
      'service_type', ds.service_type,
      'created_at', ds.created_at,
      'updated_at', ds.updated_at,
      'chauffeurs', jsonb_build_object(
        'display_name', c.display_name,
        'email', c.email,
        'phone_number', c.phone_number
      ),
      'subscription_plans', jsonb_build_object(
        'id', sp.id,
        'name', sp.name,
        'price', sp.price,
        'rides_included', sp.rides_included,
        'duration_days', sp.duration_days
      )
    )
  ) INTO driver_subs
  FROM public.driver_subscriptions ds
  LEFT JOIN public.chauffeurs c ON ds.driver_id = c.user_id
  LEFT JOIN public.subscription_plans sp ON ds.plan_id = sp.id;

  -- Récupérer les abonnements location
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', prs.id,
      'partner_id', prs.partner_id,
      'plan_id', prs.plan_id,
      'status', prs.status,
      'start_date', prs.start_date,
      'end_date', prs.end_date,
      'auto_renew', prs.auto_renew,
      'created_at', prs.created_at,
      'partenaires', jsonb_build_object(
        'company_name', p.company_name,
        'email', p.email
      )
    )
  ) INTO rental_subs
  FROM public.partner_rental_subscriptions prs
  LEFT JOIN public.partenaires p ON prs.partner_id = p.id;

  -- Calculer les statistiques
  SELECT 
    COUNT(*) FILTER (WHERE status = 'active'),
    COALESCE(SUM(sp.price) FILTER (WHERE ds.status = 'active'), 0)
  INTO total_active, monthly_revenue
  FROM public.driver_subscriptions ds
  LEFT JOIN public.subscription_plans sp ON ds.plan_id = sp.id;

  -- Construire le résultat final
  result := jsonb_build_object(
    'driverSubscriptions', COALESCE(driver_subs, '[]'::jsonb),
    'rentalSubscriptions', COALESCE(rental_subs, '[]'::jsonb),
    'stats', jsonb_build_object(
      'totalActiveSubscriptions', total_active,
      'monthlyRevenue', monthly_revenue,
      'driverSubscriptions', (SELECT COUNT(*) FROM public.driver_subscriptions WHERE status = 'active'),
      'rentalSubscriptions', (SELECT COUNT(*) FROM public.partner_rental_subscriptions WHERE status = 'active')
    )
  );

  RETURN result;
END;
$$;