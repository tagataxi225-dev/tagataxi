-- =============================================
-- CORRECTION FONCTION RPC - Currency field
-- =============================================

CREATE OR REPLACE FUNCTION public.get_admin_subscriptions_unified()
RETURNS TABLE (
  subscription_id uuid,
  subscription_type text,
  status text,
  user_id uuid,
  user_name text,
  user_email text,
  plan_id uuid,
  plan_name text,
  plan_price numeric,
  currency text,
  start_date timestamptz,
  end_date timestamptz,
  rides_remaining integer,
  rides_included integer,
  auto_renew boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  -- Abonnements chauffeurs
  SELECT 
    ds.id as subscription_id,
    'driver'::text as subscription_type,
    ds.status,
    c.user_id,
    c.display_name as user_name,
    c.email as user_email,
    sp.id as plan_id,
    sp.name as plan_name,
    sp.price as plan_price,
    COALESCE(sp.currency, 'CDF'::text) as currency,
    ds.start_date,
    ds.end_date,
    ds.rides_remaining,
    sp.rides_included,
    ds.auto_renew,
    ds.created_at,
    ds.updated_at
  FROM driver_subscriptions ds
  LEFT JOIN chauffeurs c ON ds.driver_id = c.user_id
  LEFT JOIN subscription_plans sp ON ds.plan_id = sp.id
  
  UNION ALL
  
  -- Abonnements location (correction: utiliser rsp.currency au lieu de prs.currency)
  SELECT 
    prs.id as subscription_id,
    'rental'::text as subscription_type,
    prs.status,
    p.user_id,
    p.company_name as user_name,
    p.email as user_email,
    rsp.id as plan_id,
    rsp.name as plan_name,
    rsp.monthly_price as plan_price,
    COALESCE(rsp.currency, 'CDF'::text) as currency,  -- CORRECTION ICI
    prs.start_date,
    prs.end_date,
    NULL::integer as rides_remaining,
    NULL::integer as rides_included,
    prs.auto_renew,
    prs.created_at,
    prs.updated_at
  FROM partner_rental_subscriptions prs
  LEFT JOIN partenaires p ON prs.partner_id = p.id
  LEFT JOIN rental_subscription_plans rsp ON prs.plan_id = rsp.id
  
  ORDER BY created_at DESC;
END;
$$;