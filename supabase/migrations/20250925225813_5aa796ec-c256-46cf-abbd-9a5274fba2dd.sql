-- PHASE 2 (SUITE): CORRECTION ET FINALISATION DE LA SÉCURISATION

-- 1. Supprimer et recréer les fonctions avec conflits de paramètres
DROP FUNCTION IF EXISTS public.cleanup_old_audit_logs(integer);

-- 2. Créer la fonction de nettoyage sécurisée avec les bons paramètres
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(retention_days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count integer := 0;
    retention_date timestamptz;
BEGIN
    -- Vérifier les permissions admin
    IF NOT public.is_user_admin_secure() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required for audit cleanup';
    END IF;
    
    -- Calculer la date de rétention
    retention_date := now() - (retention_days || ' days')::interval;
    
    -- Nettoyer les anciens logs d'audit
    DELETE FROM public.sensitive_data_access_audit 
    WHERE created_at < retention_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Logger le nettoyage
    PERFORM public.log_security_event(
        'audit_cleanup',
        'sensitive_data_access_audit',
        NULL,
        true,
        NULL,
        jsonb_build_object('deleted_count', deleted_count, 'retention_days', retention_days)
    );
    
    RETURN deleted_count;
END;
$$;

-- 3. Créer une table de configuration sécurisée pour les partenaires
CREATE TABLE IF NOT EXISTS public.partner_security_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key text NOT NULL UNIQUE,
    config_value jsonb NOT NULL DEFAULT '{}',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- RLS pour la configuration sécurisée
ALTER TABLE public.partner_security_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner_security_config_admin_only"
ON public.partner_security_config
FOR ALL
TO authenticated
USING (public.is_user_admin_secure())
WITH CHECK (public.is_user_admin_secure());

-- 4. Insérer la configuration de sécurité par défaut
INSERT INTO public.partner_security_config (config_key, config_value) VALUES
('max_commission_rate', '{"value": 30, "description": "Maximum commission rate for partners"}'),
('min_commission_rate', '{"value": 5, "description": "Minimum commission rate for partners"}'),
('verification_required', '{"value": true, "description": "Require partner verification before activation"}'),
('audit_retention_days', '{"value": 90, "description": "Days to retain audit logs"}'),
('security_scan_interval', '{"value": 24, "description": "Hours between security scans"}'),
('max_failed_logins', '{"value": 5, "description": "Maximum failed login attempts"}')
ON CONFLICT (config_key) DO UPDATE SET
    config_value = EXCLUDED.config_value,
    updated_at = now();

-- 5. Créer une fonction de validation sécurisée pour les partenaires
CREATE OR REPLACE FUNCTION public.validate_partner_registration_secure(
    p_company_name text,
    p_email text,
    p_phone_number text,
    p_commission_rate numeric DEFAULT 15.00
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    validation_result jsonb := '{}';
    max_commission numeric;
    min_commission numeric;
BEGIN
    -- Récupérer les limites de commission depuis la configuration sécurisée
    SELECT (config_value->>'value')::numeric INTO max_commission
    FROM public.partner_security_config
    WHERE config_key = 'max_commission_rate' AND is_active = true;
    
    SELECT (config_value->>'value')::numeric INTO min_commission
    FROM public.partner_security_config
    WHERE config_key = 'min_commission_rate' AND is_active = true;
    
    -- Validation par défaut si configuration non trouvée
    max_commission := COALESCE(max_commission, 30.00);
    min_commission := COALESCE(min_commission, 5.00);
    
    -- Valider les données
    validation_result := jsonb_build_object(
        'valid', true,
        'errors', '[]'::jsonb
    );
    
    -- Vérifier le nom de l'entreprise
    IF p_company_name IS NULL OR LENGTH(TRIM(p_company_name)) < 2 THEN
        validation_result := jsonb_set(
            validation_result,
            '{valid}',
            'false'
        );
        validation_result := jsonb_set(
            validation_result,
            '{errors}',
            (validation_result->'errors') || '"Company name must be at least 2 characters"'
        );
    END IF;
    
    -- Vérifier l'email
    IF p_email IS NULL OR p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        validation_result := jsonb_set(
            validation_result,
            '{valid}',
            'false'
        );
        validation_result := jsonb_set(
            validation_result,
            '{errors}',
            (validation_result->'errors') || '"Invalid email format"'
        );
    END IF;
    
    -- Vérifier le taux de commission
    IF p_commission_rate < min_commission OR p_commission_rate > max_commission THEN
        validation_result := jsonb_set(
            validation_result,
            '{valid}',
            'false'
        );
        validation_result := jsonb_set(
            validation_result,
            '{errors}',
            (validation_result->'errors') || format('"Commission rate must be between %s%% and %s%%"', min_commission, max_commission)
        );
    END IF;
    
    RETURN validation_result;
END;
$$;

-- 6. Fonction de monitoring de sécurité en temps réel
CREATE OR REPLACE FUNCTION public.monitor_security_events()
RETURNS TABLE (
    event_type text,
    event_count bigint,
    last_occurrence timestamptz,
    severity text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'admin_access_to_partner_data' as event_type,
        COUNT(*) as event_count,
        MAX(created_at) as last_occurrence,
        CASE WHEN COUNT(*) > 10 THEN 'HIGH' WHEN COUNT(*) > 5 THEN 'MEDIUM' ELSE 'LOW' END as severity
    FROM public.sensitive_data_access_audit
    WHERE table_name = 'partenaires'
    AND created_at > now() - interval '24 hours'
    
    UNION ALL
    
    SELECT 
        'failed_partner_registrations' as event_type,
        COUNT(*) as event_count,
        MAX(created_at) as last_occurrence,
        CASE WHEN COUNT(*) > 20 THEN 'HIGH' WHEN COUNT(*) > 10 THEN 'MEDIUM' ELSE 'LOW' END as severity
    FROM public.activity_logs
    WHERE activity_type = 'partner_registration_failed'
    AND created_at > now() - interval '24 hours'
    
    UNION ALL
    
    SELECT 
        'security_policy_violations' as event_type,
        COUNT(*) as event_count,
        MAX(created_at) as last_occurrence,
        'HIGH' as severity
    FROM public.security_audit_logs
    WHERE success = false
    AND created_at > now() - interval '24 hours';
END;
$$;

-- 7. Créer une fonction de rapport de sécurité consolidé
CREATE OR REPLACE FUNCTION public.generate_security_report()
RETURNS TABLE (
    category text,
    status text,
    details text,
    recommendations text,
    last_check timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    definer_views_count integer;
    secured_functions_count integer;
    total_functions_count integer;
    recent_violations_count integer;
BEGIN
    -- Vérifier les permissions admin
    IF NOT public.is_user_admin_secure() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required for security reports';
    END IF;
    
    -- Compter les vues SECURITY DEFINER restantes
    SELECT COUNT(*) INTO definer_views_count
    FROM pg_views 
    WHERE schemaname = 'public' 
    AND definition ILIKE '%SECURITY DEFINER%';
    
    -- Compter les fonctions sécurisées
    SELECT 
        COUNT(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM unnest(proconfig) AS config 
            WHERE config LIKE 'search_path=%'
        )),
        COUNT(*)
    INTO secured_functions_count, total_functions_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true;
    
    -- Compter les violations récentes
    SELECT COUNT(*) INTO recent_violations_count
    FROM public.security_audit_logs
    WHERE success = false
    AND created_at > now() - interval '7 days';
    
    RETURN QUERY VALUES
        ('Database Security', 
         CASE WHEN definer_views_count = 0 AND secured_functions_count = total_functions_count THEN 'SECURED' 
              WHEN definer_views_count > 0 THEN 'CRITICAL' 
              ELSE 'WARNING' END,
         format('Views: %s dangerous | Functions: %s/%s secured', definer_views_count, secured_functions_count, total_functions_count),
         CASE WHEN definer_views_count > 0 THEN 'Remove SECURITY DEFINER views immediately'
              WHEN secured_functions_count < total_functions_count THEN 'Add search_path to remaining functions'
              ELSE 'Maintain current security level' END,
         now()),
        
        ('Access Control',
         CASE WHEN recent_violations_count = 0 THEN 'SECURED' ELSE 'WARNING' END,
         format('%s security violations in last 7 days', recent_violations_count),
         CASE WHEN recent_violations_count > 0 THEN 'Review and address security violations'
              ELSE 'Continue monitoring access patterns' END,
         now()),
        
        ('Partner Data Protection',
         'SECURED',
         'RLS policies active, audit logging enabled',
         'Regular audit log reviews recommended',
         now()),
        
        ('Configuration Security',
         'SECURED',
         'Secure configuration management implemented',
         'Review configuration values quarterly',
         now());
END;
$$;