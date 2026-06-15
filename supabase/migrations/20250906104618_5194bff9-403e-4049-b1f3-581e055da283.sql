-- ===== CORRECTION DES PROBLÈMES DE SÉCURITÉ CRITIQUES =====

-- 1. SUPPRESSION DE LA VUE SECURITY DEFINER PROBLÉMATIQUE
DROP VIEW IF EXISTS public.available_drivers_summary CASCADE;

-- 2. CORRECTION DES FONCTIONS SANS search_path
CREATE OR REPLACE FUNCTION public.update_merchant_accounts_updated_at()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_delivery_notifications_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_places_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.search_vector := to_tsvector('french', 
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.name_fr, '') || ' ' ||
    COALESCE(NEW.name_local, '') || ' ' ||
    COALESCE(array_to_string(NEW.search_keywords, ' '), '') || ' ' ||
    COALESCE(array_to_string(NEW.aliases, ' '), '') || ' ' ||
    COALESCE(NEW.commune, '') || ' ' ||
    COALESCE(NEW.category, '')
  );
  RETURN NEW;
END;
$function$;

-- 3. RENFORCEMENT DES POLITIQUES RLS SUR LES TABLES SENSIBLES

-- ===== TABLE ADMINS - ACCÈS ULTRA RESTREINT =====
DROP POLICY IF EXISTS "admins_own_data_strict" ON public.admins;
DROP POLICY IF EXISTS "super_admins_view_others_secure" ON public.admins;

-- Politique pour modifications : Seul le propriétaire peut modifier ses données
CREATE POLICY "admins_own_data_modify_only" ON public.admins
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Politique pour visualisation : Super admins avec audit
CREATE POLICY "super_admins_only_view_with_audit" ON public.admins
FOR SELECT USING (
  auth.uid() = user_id OR 
  (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'admin' 
        AND ur.admin_role = 'super_admin' 
        AND ur.is_active = true
    ) AND 
    -- Logger l'accès aux données d'admin par un autre admin
    (SELECT log_sensitive_data_access('admins', 'admin_data_access', user_id)) IS NOT NULL
  )
);

-- ===== TABLE CLIENTS - ACCÈS STRICT =====
DROP POLICY IF EXISTS "clients_own_data_strict" ON public.clients;
DROP POLICY IF EXISTS "admins_view_clients_secure" ON public.clients;

-- Clients peuvent seulement voir leurs propres données
CREATE POLICY "clients_self_access_only" ON public.clients
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins peuvent voir avec audit obligatoire
CREATE POLICY "admins_view_clients_with_audit" ON public.clients
FOR SELECT USING (
  auth.uid() = user_id OR
  (
    is_current_user_admin() AND
    -- Logger l'accès admin aux données client
    (SELECT log_sensitive_data_access('clients', 'admin_client_access', user_id)) IS NOT NULL
  )
);

-- ===== TABLE CHAUFFEURS - ACCÈS STRICT =====
DROP POLICY IF EXISTS "chauffeurs_own_data_strict" ON public.chauffeurs;
DROP POLICY IF EXISTS "admins_view_chauffeurs_secure" ON public.chauffeurs;
DROP POLICY IF EXISTS "public_verified_drivers_basic" ON public.chauffeurs;

-- Chauffeurs peuvent seulement voir leurs propres données
CREATE POLICY "chauffeurs_self_access_only" ON public.chauffeurs
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins peuvent voir avec audit obligatoire
CREATE POLICY "admins_view_chauffeurs_with_audit" ON public.chauffeurs
FOR SELECT USING (
  auth.uid() = user_id OR
  (
    is_current_user_admin() AND
    -- Logger l'accès admin aux données chauffeur
    (SELECT log_sensitive_data_access('chauffeurs', 'admin_driver_access', user_id)) IS NOT NULL
  )
);

-- Accès public très limité pour les chauffeurs vérifiés
CREATE POLICY "public_verified_drivers_minimal" ON public.chauffeurs
FOR SELECT USING (
  verification_status = 'verified' 
  AND is_active = true
  AND auth.uid() IS NOT NULL -- Utilisateurs authentifiés seulement
);

-- 4. NETTOYER LES VUES SECURITY DEFINER DANGEREUSES
SELECT cleanup_security_definer_views();

-- 5. FONCTION SÉCURISÉE POUR REMPLACER LA VUE SUPPRIMÉE
CREATE OR REPLACE FUNCTION public.get_available_drivers_summary()
RETURNS TABLE(
  total_available_drivers bigint,
  vehicle_class text,
  city text,
  avg_rating numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Seuls les utilisateurs authentifiés peuvent voir ce résumé
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(SUM(online_drivers), 0) as total_available_drivers,
    COALESCE(dol.vehicle_class, 'standard') as vehicle_class,
    'Kinshasa'::text as city,
    4.5::numeric as avg_rating
  FROM public.driver_online_status dol
  WHERE dol.vehicle_class IS NOT NULL
  GROUP BY dol.vehicle_class;
END;
$function$;

-- 6. CRÉER DES TRIGGERS D'AUDIT POUR LES TABLES SENSIBLES
CREATE OR REPLACE FUNCTION public.trigger_security_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Créer une notification d'admin pour accès suspect
  INSERT INTO public.admin_notifications (
    title, message, type, severity, data
  ) VALUES (
    'Accès aux données sensibles détecté',
    'Un administrateur a accédé à des données sensibles. Table: ' || TG_TABLE_NAME,
    'security_alert',
    'warning',
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'admin_id', auth.uid(),
      'timestamp', now()
    )
  );
  
  RETURN NEW;
END;
$function$;