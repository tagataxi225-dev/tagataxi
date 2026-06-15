-- Fix get_admin_subscriptions_unified: use correct column names
-- sp.monthly_fee → sp.price
-- rsp.monthly_fee → rsp.monthly_price  
-- rsp.vehicle_limit → rsp.max_vehicles

CREATE OR REPLACE FUNCTION public.get_admin_subscriptions_unified()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
        'monthly_fee', COALESCE(sp.price, 0),
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
    COALESCE(SUM(sp.price), 0),
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
        'monthly_fee', COALESCE(rsp.monthly_price, 0),
        'status', prs.status,
        'start_date', prs.start_date,
        'end_date', prs.end_date,
        'auto_renew', prs.auto_renew,
        'vehicles_limit', COALESCE(rsp.max_vehicles, 0),
        'created_at', prs.created_at,
        'type', 'rental'
      )
    ),
    COUNT(*),
    COALESCE(SUM(rsp.monthly_price), 0),
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
      'total_revenue', COALESCE(driver_revenue, 0) + COALESCE(rental_revenue, 0),
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
$function$;