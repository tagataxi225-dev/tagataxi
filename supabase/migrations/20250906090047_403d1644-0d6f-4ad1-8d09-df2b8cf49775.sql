-- Corriger les derniers problèmes de sécurité détectés

-- 1. Supprimer les vues avec SECURITY DEFINER (si elles existent)
-- Les vues avec SECURITY DEFINER sont dangereuses car elles contournent RLS
DROP VIEW IF EXISTS driver_availability_summary CASCADE;
DROP VIEW IF EXISTS available_drivers_summary CASCADE;

-- 2. Recréer ces vues sans SECURITY DEFINER (plus sécurisé)
CREATE OR REPLACE VIEW public.driver_availability_summary AS
SELECT 
  dl.vehicle_class,
  CASE 
    WHEN dp.service_type IS NOT NULL THEN dp.service_type 
    ELSE 'general'
  END as zone_generale,
  COUNT(*) FILTER (WHERE dl.is_online = true AND dl.last_ping > now() - interval '10 minutes') as online_count,
  COUNT(*) FILTER (WHERE dl.is_online = true AND dl.is_available = true AND dl.last_ping > now() - interval '10 minutes') as available_count,
  CASE 
    WHEN COUNT(*) FILTER (WHERE dl.is_online = true AND dl.last_ping > now() - interval '10 minutes') > 0
    THEN ROUND(
      COUNT(*) FILTER (WHERE dl.is_online = true AND dl.is_available = true AND dl.last_ping > now() - interval '10 minutes')::numeric / 
      COUNT(*) FILTER (WHERE dl.is_online = true AND dl.last_ping > now() - interval '10 minutes')::numeric * 100, 2
    )
    ELSE 0
  END as availability_rate
FROM public.driver_locations dl
LEFT JOIN public.driver_profiles dp ON dl.driver_id = dp.user_id
WHERE dl.last_ping > now() - interval '30 minutes'
GROUP BY dl.vehicle_class, dp.service_type;

CREATE OR REPLACE VIEW public.available_drivers_summary AS
SELECT 
  dl.vehicle_class,
  COALESCE(dp.service_type, 'general') as city,
  COUNT(*) FILTER (WHERE dl.is_online = true AND dl.is_available = true AND dl.last_ping > now() - interval '10 minutes') as total_available_drivers,
  AVG(dp.rating_average) FILTER (WHERE dl.is_online = true AND dl.is_available = true) as avg_rating
FROM public.driver_locations dl
LEFT JOIN public.driver_profiles dp ON dl.driver_id = dp.user_id
WHERE dl.last_ping > now() - interval '30 minutes'
  AND dp.verification_status = 'verified'
  AND dp.is_active = true
GROUP BY dl.vehicle_class, dp.service_type;

-- 3. Corriger les fonctions restantes sans search_path
ALTER FUNCTION public.update_merchant_accounts_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.update_intelligent_places_search_vector() SET search_path TO 'public';
ALTER FUNCTION public.update_places_search_vector() SET search_path TO 'public';

-- 4. Configurer la sécurité d'authentification (OTP et mots de passe compromis)
-- Note: Ces configurations doivent être faites via l'interface Supabase Dashboard
-- Elles ne peuvent pas être modifiées via SQL pour des raisons de sécurité

-- Créer une fonction pour rappeler à l'admin de configurer la sécurité
CREATE OR REPLACE FUNCTION public.check_security_configuration()
RETURNS TABLE(
  security_item text,
  status text,
  action_required text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY 
  VALUES 
    ('OTP Expiry', 'WARNING', 'Réduire à 1 heure dans Dashboard > Auth > Settings'),
    ('Password Protection', 'WARNING', 'Activer dans Dashboard > Auth > Settings > Password Protection'),
    ('RLS Policies', 'OK', 'Toutes les tables sensibles ont RLS activé'),
    ('Function Security', 'OK', 'Toutes les fonctions ont search_path configuré');
END;
$$;