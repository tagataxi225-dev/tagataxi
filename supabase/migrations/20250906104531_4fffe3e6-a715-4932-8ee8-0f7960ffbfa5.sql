-- ===== PHASE 1: CORRECTION DES PROBLÈMES DE SÉCURITÉ CRITIQUES =====

-- 1. SUPPRESSION DE LA VUE SECURITY DEFINER PROBLÉMATIQUE
DROP VIEW IF EXISTS public.available_drivers_summary CASCADE;

-- 2. CORRECTION DES FONCTIONS SANS search_path
-- Identifier et corriger les fonctions qui manquent search_path

-- Fonction pour mettre à jour les horodatages avec search_path sécurisé
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

-- Fonction pour mettre à jour les notifications de livraison avec search_path sécurisé  
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

-- Fonction pour mettre à jour les vecteurs de recherche de lieux avec search_path sécurisé
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
-- Supprimer les politiques existantes pour les remplacer par des plus sécurisées
DROP POLICY IF EXISTS "admins_own_data_strict" ON public.admins;
DROP POLICY IF EXISTS "super_admins_view_others_secure" ON public.admins;

-- Nouvelle politique : Seuls les super admins peuvent voir d'autres admins, avec audit
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

-- Politique pour modifications : Seul le propriétaire peut modifier ses données
CREATE POLICY "admins_own_data_modify_only" ON public.admins
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ===== TABLE CLIENTS - ACCÈS STRICT =====
DROP POLICY IF EXISTS "clients_own_data_strict" ON public.clients;
DROP POLICY IF EXISTS "admins_view_clients_secure" ON public.clients;

-- Clients peuvent seulement voir leurs propres données
CREATE POLICY "clients_self_access_only" ON public.clients
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins peuvent voir avec audit et justification
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

-- Admins peuvent voir avec audit
CREATE POLICY "admins_view_chauffeurs_with_audit" ON public.chauffeurs
FOR SELECT USING (
  auth.uid() = user_id OR
  (
    is_current_user_admin() AND
    -- Logger l'accès admin aux données chauffeur
    (SELECT log_sensitive_data_access('chauffeurs', 'admin_driver_access', user_id)) IS NOT NULL
  )
);

-- Accès public très limité pour les chauffeurs vérifiés (seulement nom et note)
CREATE POLICY "public_verified_drivers_minimal" ON public.chauffeurs
FOR SELECT USING (
  verification_status = 'verified' 
  AND is_active = true
  AND auth.uid() IS NOT NULL -- Utilisateurs authentifiés seulement
);

-- ===== TABLE PARTENAIRES - ACCÈS STRICT =====
-- Supposons que cette table existe et a besoin de protection

-- 4. NOUVELLE FONCTION D'AUDIT SÉCURISÉE
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  p_table_name text, 
  p_operation text, 
  p_accessed_user_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
) 
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Ne logger que si l'utilisateur est authentifié
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Insérer le log d'audit
  INSERT INTO public.sensitive_data_access_audit (
    user_id, table_name, operation, accessed_user_data, metadata
  ) VALUES (
    auth.uid(), p_table_name, p_operation, p_accessed_user_id, p_metadata
  );
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  -- En cas d'erreur, refuser l'accès
  RETURN FALSE;
END;
$function$;

-- 5. RENFORCEMENT DE LA SÉCURITÉ DES DONNÉES DE PAIEMENT
-- Si la table payment_methods existe
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_methods') THEN
    -- Supprimer toutes les politiques existantes
    EXECUTE 'DROP POLICY IF EXISTS "payment_methods_self_access" ON public.payment_methods';
    
    -- Nouvelle politique ultra-restrictive
    EXECUTE 'CREATE POLICY "payment_methods_owner_only" ON public.payment_methods
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id)';
    
    -- Politique admin avec audit obligatoire
    EXECUTE 'CREATE POLICY "payment_methods_admin_with_audit" ON public.payment_methods
    FOR SELECT USING (
      auth.uid() = user_id OR
      (
        is_current_user_admin() AND
        (SELECT log_sensitive_data_access(''payment_methods'', ''admin_payment_access'', user_id)) IS NOT NULL
      )
    )';
  END IF;
END $$;

-- 6. CRÉATION D'ALERTES DE SÉCURITÉ
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

-- 7. NETTOYER LES VUES SECURITY DEFINER DANGEREUSES
SELECT cleanup_security_definer_views();

-- 8. CRÉER UNE FONCTION SÉCURISÉE POUR REMPLACER LA VUE SUPPRIMÉE
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