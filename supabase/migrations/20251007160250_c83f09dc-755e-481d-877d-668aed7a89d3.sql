-- ═══════════════════════════════════════════════════════════════
-- PHASE 1 : CORRECTIONS CRITIQUES DE SÉCURITÉ (CORRIGÉ)
-- ═══════════════════════════════════════════════════════════════

-- 1. SUPPRESSION DES VUES MATÉRIALISÉES SECURITY DEFINER
DROP MATERIALIZED VIEW IF EXISTS public.admin_users_cache CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.ai_performance_stats CASCADE;

-- 2. CRÉER FONCTIONS SECURITY DEFINER SÉCURISÉES AVEC search_path

-- Fonction admin cache (remplace vue matérialisée)
CREATE OR REPLACE FUNCTION public.get_admin_users_cache()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  role user_role,
  admin_role admin_role,
  permissions text[],
  department text,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  last_login timestamp with time zone,
  admin_level text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.user_id,
    a.email,
    a.display_name,
    ur.role,
    ur.admin_role,
    a.permissions,
    a.department,
    a.is_active,
    a.created_at,
    a.updated_at,
    a.last_login,
    a.admin_level
  FROM public.admins a
  LEFT JOIN public.user_roles ur ON a.user_id = ur.user_id AND ur.role = 'admin'
  WHERE is_current_user_admin() OR auth.uid() = a.user_id;
$$;

-- Fonction AI stats (remplace vue matérialisée)
CREATE OR REPLACE FUNCTION public.get_ai_performance_stats(days_back integer DEFAULT 30)
RETURNS TABLE (
  day timestamp with time zone,
  context text,
  function_called text,
  total_calls bigint,
  successful_calls bigint,
  failed_calls bigint,
  avg_response_time_ms numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    DATE_TRUNC('day', created_at) as day,
    context,
    function_called,
    COUNT(*) as total_calls,
    COUNT(*) FILTER (WHERE success = true) as successful_calls,
    COUNT(*) FILTER (WHERE success = false) as failed_calls,
    ROUND(AVG(response_time_ms)::numeric, 2) as avg_response_time_ms
  FROM public.ai_interactions
  WHERE created_at > now() - (days_back || ' days')::interval
    AND (is_current_user_admin() OR auth.uid() = user_id)
  GROUP BY DATE_TRUNC('day', created_at), context, function_called
  ORDER BY day DESC, total_calls DESC;
$$;

-- 3. CORRIGER FONCTIONS SANS search_path

CREATE OR REPLACE FUNCTION public.geocode_location(query_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'status', 'OK',
    'results', json_build_array(
      json_build_object(
        'formatted_address', query_text || ', Kinshasa, RDC',
        'geometry', json_build_object(
          'location', json_build_object(
            'lat', -4.3217 + (random() - 0.5) * 0.1,
            'lng', 15.3069 + (random() - 0.5) * 0.1
          )
        )
      )
    )
  ) INTO result;
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_orange_money_payment(
  p_user_id uuid,
  p_amount numeric,
  p_currency text,
  p_transaction_ref text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  wallet_id uuid;
  txn_id uuid;
BEGIN
  INSERT INTO public.user_wallets (user_id, balance, currency)
  VALUES (p_user_id, 0, p_currency)
  ON CONFLICT (user_id, currency) DO NOTHING;
  
  SELECT id INTO wallet_id
  FROM public.user_wallets
  WHERE user_id = p_user_id AND currency = p_currency;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, transaction_type, amount, currency,
    description, reference_id, reference_type
  ) VALUES (
    wallet_id, p_user_id, 'deposit', p_amount, p_currency,
    'Dépôt via Orange Money', p_transaction_ref, 'orange_money'
  )
  RETURNING id INTO txn_id;

  UPDATE public.user_wallets
  SET balance = balance + p_amount, updated_at = now()
  WHERE id = wallet_id;

  RETURN txn_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.link_payment_to_subscription(
  payment_id uuid,
  subscription_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.rental_subscription_payments 
  SET subscription_id = link_payment_to_subscription.subscription_id,
      updated_at = now()
  WHERE id = payment_id;
  RETURN FOUND;
END;
$function$;

-- 4. LOGGING
INSERT INTO public.activity_logs (
  user_id, activity_type, description, metadata
) VALUES (
  COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
  'security_patch_phase1',
  'Phase 1 appliquée: vues matérialisées supprimées, search_path ajouté',
  jsonb_build_object(
    'views_removed', ARRAY['admin_users_cache', 'ai_performance_stats'],
    'functions_secured', 3
  )
);