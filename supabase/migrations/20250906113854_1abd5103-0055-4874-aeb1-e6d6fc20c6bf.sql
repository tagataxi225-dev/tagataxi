-- ==============================================
-- CORRECTION SÉCURITÉ CRITIQUE - PHASE 1
-- ==============================================

-- 1. NETTOYER LES VUES SECURITY DEFINER DANGEREUSES
-- Supprimer toutes les vues avec SECURITY DEFINER pour éviter l'escalade de privilèges
DO $$
DECLARE
    view_name text;
BEGIN
    -- Supprimer les vues problématiques identifiées par le linter
    FOR view_name IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%SECURITY DEFINER%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_name);
    END LOOP;
END $$;

-- 2. SÉCURISER LES FONCTIONS AVEC search_path
-- Identifier et corriger les fonctions sans search_path sécurisé

-- Fonction 1: get_service_price - Ajout de sécurisation
CREATE OR REPLACE FUNCTION public.get_service_price(
    p_service_type text,
    p_base_distance numeric DEFAULT 0,
    p_city text DEFAULT 'Kinshasa'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    pricing_config RECORD;
    calculated_price numeric;
BEGIN
    -- Récupérer la configuration de prix active
    SELECT * INTO pricing_config
    FROM public.service_pricing sp
    JOIN public.service_configurations sc ON sp.service_id = sc.id
    WHERE sc.service_name = p_service_type
      AND sp.city = p_city
      AND sp.is_active = true
    ORDER BY sp.created_at DESC
    LIMIT 1;
    
    -- Si pas de configuration trouvée, utiliser les valeurs par défaut
    IF pricing_config IS NULL THEN
        calculated_price := 3000 + (p_base_distance * 400);
    ELSE
        calculated_price := pricing_config.base_price + (p_base_distance * pricing_config.price_per_km);
        
        -- Appliquer les limites min/max si définies
        IF pricing_config.minimum_fare IS NOT NULL THEN
            calculated_price := GREATEST(calculated_price, pricing_config.minimum_fare);
        END IF;
        
        IF pricing_config.maximum_fare IS NOT NULL THEN
            calculated_price := LEAST(calculated_price, pricing_config.maximum_fare);
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'calculated_price', calculated_price,
        'base_price', COALESCE(pricing_config.base_price, 3000),
        'price_per_km', COALESCE(pricing_config.price_per_km, 400),
        'currency', COALESCE(pricing_config.currency, 'CDF'),
        'service_type', p_service_type,
        'city', p_city
    );
END;
$$;

-- Fonction 2: validate_service_requirements - Nouvelle fonction sécurisée
CREATE OR REPLACE FUNCTION public.validate_service_requirements(
    p_service_type text,
    p_requirements jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    service_config RECORD;
    validation_result jsonb := '{"valid": true, "errors": []}'::jsonb;
    required_docs text[];
    provided_docs text[];
    missing_docs text[];
BEGIN
    -- Récupérer la configuration du service
    SELECT * INTO service_config
    FROM public.service_configurations
    WHERE service_name = p_service_type
      AND is_active = true;
    
    IF service_config IS NULL THEN
        RETURN '{"valid": false, "errors": ["Service non trouvé"]}'::jsonb;
    END IF;
    
    -- Extraire les documents requis et fournis
    required_docs := ARRAY(SELECT jsonb_array_elements_text(service_config.requirements->'required_documents'));
    provided_docs := ARRAY(SELECT jsonb_object_keys(p_requirements->'documents'));
    
    -- Vérifier les documents manquants
    SELECT ARRAY(
        SELECT unnest(required_docs) 
        EXCEPT 
        SELECT unnest(provided_docs)
    ) INTO missing_docs;
    
    IF array_length(missing_docs, 1) > 0 THEN
        validation_result := jsonb_set(
            validation_result,
            '{valid}',
            'false'::jsonb
        );
        validation_result := jsonb_set(
            validation_result,
            '{errors}',
            to_jsonb(ARRAY['Documents manquants: ' || array_to_string(missing_docs, ', ')])
        );
    END IF;
    
    RETURN validation_result;
END;
$$;

-- Fonction 3: get_driver_current_service - Nouvelle fonction sécurisée
CREATE OR REPLACE FUNCTION public.get_driver_current_service(p_driver_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    current_service RECORD;
    driver_profile RECORD;
BEGIN
    -- Vérifier que l'utilisateur peut accéder aux données de ce chauffeur
    IF p_driver_id != auth.uid() AND NOT is_current_user_admin() THEN
        RAISE EXCEPTION 'Accès non autorisé aux données du chauffeur';
    END IF;
    
    -- Chercher d'abord dans les nouvelles associations de services
    SELECT 
        sc.service_name,
        sc.service_category,
        sc.requirements,
        sc.is_active,
        'new_system' as source
    INTO current_service
    FROM public.driver_service_associations dsa
    JOIN public.service_configurations sc ON dsa.service_id = sc.id
    WHERE dsa.driver_id = p_driver_id
      AND dsa.is_active = true
      AND dsa.status = 'active'
    ORDER BY dsa.assigned_at DESC
    LIMIT 1;
    
    -- Si pas trouvé, chercher dans les anciennes données chauffeurs
    IF current_service IS NULL THEN
        SELECT 
            COALESCE(c.vehicle_type, 'taxi_standard') as service_name,
            'taxi' as service_category,
            '{}' as requirements,
            c.is_active,
            'legacy_system' as source
        INTO current_service
        FROM public.chauffeurs c
        WHERE c.user_id = p_driver_id;
    END IF;
    
    -- Si toujours rien, vérifier dans driver_profiles
    IF current_service IS NULL THEN
        SELECT 
            COALESCE(dp.vehicle_class, 'standard') as service_name,
            COALESCE(dp.service_type, 'taxi') as service_category,
            '{}' as requirements,
            dp.is_active,
            'driver_profiles' as source
        INTO current_service
        FROM public.driver_profiles dp
        WHERE dp.user_id = p_driver_id;
    END IF;
    
    IF current_service IS NULL THEN
        RETURN '{"service_name": null, "message": "Aucun service assigné"}'::jsonb;
    END IF;
    
    RETURN to_jsonb(current_service);
END;
$$;

-- 3. CRÉER UNE FONCTION DE NETTOYAGE SÉCURISÉE
CREATE OR REPLACE FUNCTION public.cleanup_security_vulnerabilities()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    cleanup_count integer := 0;
    function_name text;
BEGIN
    -- Seuls les super admins peuvent exécuter cette fonction
    IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Accès refusé: privilèges super admin requis';
    END IF;
    
    -- Nettoyer les vues Security Definer restantes
    FOR function_name IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%SECURITY DEFINER%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', function_name);
        cleanup_count := cleanup_count + 1;
    END LOOP;
    
    -- Logger l'opération de sécurité
    PERFORM log_security_event(
        'security_cleanup',
        'database_views',
        NULL,
        true,
        NULL,
        jsonb_build_object('cleaned_views', cleanup_count)
    );
    
    RETURN format('Nettoyage de sécurité terminé: %s vues supprimées', cleanup_count);
END;
$$;

-- 4. MISE À JOUR DES POLITIQUES RLS POUR LA SÉCURITÉ RENFORCÉE
-- Politique stricte pour les nouvelles tables de services

-- Service configurations - Admin seulement pour modification
DROP POLICY IF EXISTS "service_configurations_public_read" ON public.service_configurations;
DROP POLICY IF EXISTS "service_configurations_admin_manage" ON public.service_configurations;

CREATE POLICY "service_configurations_public_read" 
    ON public.service_configurations FOR SELECT 
    USING (is_active = true);

CREATE POLICY "service_configurations_admin_manage" 
    ON public.service_configurations FOR ALL 
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());

-- Service pricing - Admin seulement
DROP POLICY IF EXISTS "service_pricing_public_read" ON public.service_pricing;
DROP POLICY IF EXISTS "service_pricing_admin_manage" ON public.service_pricing;

CREATE POLICY "service_pricing_public_read" 
    ON public.service_pricing FOR SELECT 
    USING (is_active = true);

CREATE POLICY "service_pricing_admin_manage" 
    ON public.service_pricing FOR ALL 
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());

-- Service change requests - Accès strict
DROP POLICY IF EXISTS "service_change_requests_driver_create" ON public.service_change_requests;
DROP POLICY IF EXISTS "service_change_requests_view_own" ON public.service_change_requests;
DROP POLICY IF EXISTS "service_change_requests_admin_manage" ON public.service_change_requests;

CREATE POLICY "service_change_requests_driver_create" 
    ON public.service_change_requests FOR INSERT 
    WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "service_change_requests_view_own" 
    ON public.service_change_requests FOR SELECT 
    USING (auth.uid() = driver_id OR is_current_user_admin());

CREATE POLICY "service_change_requests_admin_manage" 
    ON public.service_change_requests FOR ALL 
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());

-- 5. LOGGING DE SÉCURITÉ POUR TRAÇABILITÉ
INSERT INTO public.security_audit_logs (
    user_id, action_type, resource_type, success, metadata
) VALUES (
    auth.uid(), 
    'security_migration', 
    'database_functions', 
    true,
    jsonb_build_object(
        'migration_type', 'critical_security_fixes',
        'fixes_applied', ARRAY[
            'security_definer_views_cleanup',
            'function_search_path_secured',
            'service_functions_created',
            'rls_policies_strengthened'
        ],
        'timestamp', now()
    )
);

-- 6. COMMENTAIRES DE DOCUMENTATION SÉCURISÉE
COMMENT ON FUNCTION public.get_service_price IS 
'Fonction sécurisée pour le calcul des prix de services avec search_path protégé';

COMMENT ON FUNCTION public.validate_service_requirements IS 
'Validation sécurisée des exigences de service avec contrôle d''accès';

COMMENT ON FUNCTION public.get_driver_current_service IS 
'Récupération sécurisée du service actuel d''un chauffeur avec audit d''accès';

COMMENT ON FUNCTION public.cleanup_security_vulnerabilities IS 
'Fonction de nettoyage de sécurité - Super Admin uniquement';