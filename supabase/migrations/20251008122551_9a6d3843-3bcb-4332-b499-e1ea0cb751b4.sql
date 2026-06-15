-- ==========================================
-- ÉTAPE 1 : SÉCURITÉ CRITIQUE - RLS FIXES (v3)
-- ==========================================

-- ==========================================
-- 1. SUPPRIMER POLICIES DÉPENDANTES ET RECRÉER FONCTION
-- ==========================================

-- Supprimer les policies qui dépendent de log_sensitive_access
DROP POLICY IF EXISTS "clients_admin_audited_access" ON public.clients;
DROP POLICY IF EXISTS "clients_strict_isolation" ON public.clients;

-- Maintenant on peut supprimer la fonction
DROP FUNCTION IF EXISTS public.log_sensitive_access(TEXT, TEXT, UUID) CASCADE;

-- Recréer la fonction avec la bonne signature
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  table_name TEXT,
  access_type TEXT,
  accessed_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    action_type,
    resource_type,
    resource_id,
    metadata,
    success
  ) VALUES (
    auth.uid(),
    access_type,
    table_name,
    accessed_user_id,
    jsonb_build_object(
      'timestamp', now(),
      'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
    ),
    true
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL::UUID;
END;
$$;

-- ==========================================
-- 2. RECRÉER LES POLICIES SÉCURISÉES
-- ==========================================

-- Policy admin stricte avec audit obligatoire
CREATE POLICY "clients_super_admin_audited_access"
ON public.clients
FOR SELECT
TO authenticated
USING (
  is_current_user_super_admin() 
  AND log_sensitive_access('clients', 'ADMIN_SELECT', user_id) IS NOT NULL
);

-- Policy utilisateur standard (données personnelles uniquement)
CREATE POLICY "clients_strict_own_data"
ON public.clients
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 3. SÉCURISER TOUTES LES FONCTIONS PL/PGSQL
-- ==========================================

-- Ajouter SET search_path à toutes les fonctions qui n'en ont pas
ALTER FUNCTION public.update_notification_campaign_updated_at() SET search_path = public;
ALTER FUNCTION public.increment_product_views() SET search_path = public;
ALTER FUNCTION public.update_product_sales_count() SET search_path = public;
ALTER FUNCTION public.validate_email_format() SET search_path = public;
ALTER FUNCTION public.log_rental_moderation_change() SET search_path = public;
ALTER FUNCTION public.update_transport_booking_updated_at() SET search_path = public;
ALTER FUNCTION public.update_driver_assignment_timestamp() SET search_path = public;
ALTER FUNCTION public.update_marketplace_order_updated_at() SET search_path = public;
ALTER FUNCTION public.update_rides_remaining_on_subscription() SET search_path = public;
ALTER FUNCTION public.validate_activity_log_user_id() SET search_path = public;
ALTER FUNCTION public.check_global_email_phone_uniqueness() SET search_path = public;
ALTER FUNCTION public.update_delivery_assignment_timestamp() SET search_path = public;
ALTER FUNCTION public.update_intelligent_places_search_vector() SET search_path = public;
ALTER FUNCTION public.update_merchant_accounts_updated_at() SET search_path = public;
ALTER FUNCTION public.auto_log_partner_changes() SET search_path = public;
ALTER FUNCTION public.update_product_rating_stats() SET search_path = public;
ALTER FUNCTION public.sync_seller_on_verification_approval() SET search_path = public;
ALTER FUNCTION public.update_delivery_order_pricing() SET search_path = public;
ALTER FUNCTION public.sync_seller_profile_on_approval() SET search_path = public;
ALTER FUNCTION public.update_user_preferences_timestamp() SET search_path = public;
ALTER FUNCTION public.bump_unified_conversation_last_message_at() SET search_path = public;
ALTER FUNCTION public.activate_approved_vehicles() SET search_path = public;
ALTER FUNCTION public.update_push_notifications_updated_at() SET search_path = public;
ALTER FUNCTION public.trigger_refresh_admin_cache() SET search_path = public;
ALTER FUNCTION public.update_places_search_vector() SET search_path = public;

-- ==========================================
-- 4. DOCUMENTATION
-- ==========================================

COMMENT ON FUNCTION public.log_sensitive_access IS 
'🔐 Fonction d''audit obligatoire pour tracer tous les accès aux données sensibles (clients, payment_methods, etc.)';

COMMENT ON POLICY "clients_super_admin_audited_access" ON public.clients IS 
'🔒 Accès réservé aux super admins uniquement, avec audit automatique via log_sensitive_access()';

COMMENT ON POLICY "clients_strict_own_data" ON public.clients IS 
'✅ Accès strict aux données personnelles uniquement (user_id = auth.uid())';
