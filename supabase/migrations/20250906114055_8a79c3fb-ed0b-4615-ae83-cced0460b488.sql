-- ==============================================
-- MIGRATION DES DONNÉES EXISTANTES - PHASE 2
-- ==============================================

-- 1. MIGRATION DES CHAUFFEURS EXISTANTS VERS LE NOUVEAU SYSTÈME
-- Créer une fonction de migration pour mapper automatiquement les services

CREATE OR REPLACE FUNCTION public.migrate_legacy_drivers_to_services()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    migrated_count integer := 0;
    error_count integer := 0;
    driver_record RECORD;
    service_id uuid;
    service_name text;
    migration_result jsonb;
BEGIN
    -- Seuls les admins peuvent exécuter cette migration
    IF NOT is_current_user_admin() THEN
        RAISE EXCEPTION 'Accès refusé: privilèges admin requis pour la migration';
    END IF;

    -- Parcourir tous les chauffeurs actifs sans association de service
    FOR driver_record IN 
        SELECT 
            c.user_id,
            c.vehicle_type,
            c.vehicle_class,
            c.service_areas,
            c.delivery_capacity,
            c.is_active,
            c.verification_status,
            dp.service_type as profile_service_type,
            dp.vehicle_class as profile_vehicle_class
        FROM public.chauffeurs c
        LEFT JOIN public.driver_profiles dp ON c.user_id = dp.user_id
        LEFT JOIN public.driver_service_associations dsa ON c.user_id = dsa.driver_id
        WHERE dsa.driver_id IS NULL  -- Pas encore migré
          AND c.is_active = true
    LOOP
        BEGIN
            -- Déterminer le service approprié basé sur les données existantes
            service_name := public.map_legacy_data_to_service(
                driver_record.vehicle_type,
                driver_record.vehicle_class,
                driver_record.profile_service_type,
                driver_record.profile_vehicle_class,
                driver_record.delivery_capacity
            );
            
            -- Récupérer l'ID du service
            SELECT id INTO service_id
            FROM public.service_configurations
            WHERE service_name = service_name
              AND is_active = true
            LIMIT 1;
            
            -- Si le service n'existe pas, utiliser taxi_standard par défaut
            IF service_id IS NULL THEN
                SELECT id INTO service_id
                FROM public.service_configurations
                WHERE service_name = 'taxi_standard'
                  AND is_active = true
                LIMIT 1;
                service_name := 'taxi_standard';
            END IF;
            
            -- Créer l'association de service
            INSERT INTO public.driver_service_associations (
                driver_id,
                service_id,
                assigned_at,
                assigned_by,
                status,
                is_active,
                notes,
                migration_source
            ) VALUES (
                driver_record.user_id,
                service_id,
                now(),
                auth.uid(),
                CASE 
                    WHEN driver_record.verification_status = 'verified' THEN 'active'
                    ELSE 'pending_verification'
                END,
                true,
                format('Migration automatique: %s -> %s', 
                    COALESCE(driver_record.vehicle_type, 'unknown'), 
                    service_name),
                'legacy_migration'
            );
            
            migrated_count := migrated_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            
            -- Logger l'erreur
            INSERT INTO public.data_migration_logs (
                migration_type, target_id, error_message, migration_data
            ) VALUES (
                'driver_service_migration', 
                driver_record.user_id, 
                SQLERRM,
                to_jsonb(driver_record)
            );
        END;
    END LOOP;
    
    -- Préparer le résultat de migration
    migration_result := jsonb_build_object(
        'success', true,
        'migrated_drivers', migrated_count,
        'errors', error_count,
        'timestamp', now(),
        'performed_by', auth.uid()
    );
    
    -- Logger le résultat global
    INSERT INTO public.data_migration_logs (
        migration_type, target_id, success, migration_data
    ) VALUES (
        'complete_driver_migration', 
        auth.uid(), 
        true,
        migration_result
    );
    
    RETURN migration_result;
END;
$$;

-- 2. FONCTION DE MAPPING DES DONNÉES LEGACY VERS LES NOUVEAUX SERVICES
CREATE OR REPLACE FUNCTION public.map_legacy_data_to_service(
    p_vehicle_type text DEFAULT NULL,
    p_vehicle_class text DEFAULT NULL,
    p_profile_service_type text DEFAULT NULL,
    p_profile_vehicle_class text DEFAULT NULL,
    p_delivery_capacity text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Prioriser delivery_capacity pour les services de livraison
    IF p_delivery_capacity IS NOT NULL THEN
        CASE p_delivery_capacity
            WHEN 'light', 'small' THEN RETURN 'delivery_flash';
            WHEN 'medium', 'standard' THEN RETURN 'delivery_flex';
            WHEN 'large', 'heavy' THEN RETURN 'delivery_maxicharge';
            ELSE RETURN 'delivery_flex';
        END CASE;
    END IF;
    
    -- Mapper selon profile_service_type
    IF p_profile_service_type IS NOT NULL THEN
        CASE p_profile_service_type
            WHEN 'delivery' THEN RETURN 'delivery_flex';
            WHEN 'taxi' THEN 
                -- Sous-catégoriser selon vehicle_class
                CASE COALESCE(p_profile_vehicle_class, p_vehicle_class, 'standard')
                    WHEN 'premium', 'luxury' THEN RETURN 'taxi_premium';
                    WHEN 'comfort', 'confort' THEN RETURN 'taxi_confort';
                    WHEN 'economic', 'eco', 'economique' THEN RETURN 'taxi_eco';
                    ELSE RETURN 'taxi_standard';
                END CASE;
            ELSE RETURN 'taxi_standard';
        END CASE;
    END IF;
    
    -- Mapper selon vehicle_type (ancienne logique)
    IF p_vehicle_type IS NOT NULL THEN
        CASE p_vehicle_type
            WHEN 'moto', 'motorcycle', 'bike' THEN RETURN 'moto_transport';
            WHEN 'taxi', 'car' THEN 
                CASE COALESCE(p_vehicle_class, 'standard')
                    WHEN 'premium', 'luxury' THEN RETURN 'taxi_premium';
                    WHEN 'comfort', 'confort' THEN RETURN 'taxi_confort';
                    WHEN 'economic', 'eco' THEN RETURN 'taxi_eco';
                    ELSE RETURN 'taxi_standard';
                END CASE;
            WHEN 'delivery', 'van', 'truck' THEN RETURN 'delivery_flex';
            ELSE RETURN 'taxi_standard';
        END CASE;
    END IF;
    
    -- Mapper selon vehicle_class uniquement
    CASE COALESCE(p_vehicle_class, 'standard')
        WHEN 'moto', 'motorcycle' THEN RETURN 'moto_transport';
        WHEN 'premium', 'luxury' THEN RETURN 'taxi_premium';
        WHEN 'comfort', 'confort' THEN RETURN 'taxi_confort';
        WHEN 'economic', 'eco' THEN RETURN 'taxi_eco';
        ELSE RETURN 'taxi_standard';
    END CASE;
END;
$$;

-- 3. CRÉER LA TABLE DE LOGS DE MIGRATION
CREATE TABLE IF NOT EXISTS public.data_migration_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_type text NOT NULL,
    target_id uuid,
    success boolean DEFAULT true,
    error_message text,
    migration_data jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid DEFAULT auth.uid()
);

-- Enable RLS sur la table de logs
ALTER TABLE public.data_migration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "migration_logs_admin_access" 
    ON public.data_migration_logs FOR ALL 
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());

-- 4. AJOUTER UNE COLONNE DE COMPATIBILITÉ DANS CHAUFFEURS
-- Pour maintenir la compatibilité pendant la transition
ALTER TABLE public.chauffeurs 
ADD COLUMN IF NOT EXISTS migrated_service_type text,
ADD COLUMN IF NOT EXISTS migration_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS migrated_at timestamp with time zone;

-- 5. CRÉER UNE VUE UNIFIÉE POUR LA COMPATIBILITÉ
CREATE OR REPLACE VIEW public.driver_service_status AS
SELECT 
    c.user_id as driver_id,
    c.display_name,
    c.email,
    c.phone_number,
    c.is_active as driver_active,
    c.verification_status as driver_verification,
    
    -- Nouveau système (prioritaire)
    sc.service_name as current_service,
    sc.service_category,
    sc.display_name as service_display_name,
    dsa.status as service_status,
    dsa.assigned_at as service_assigned_at,
    dsa.is_active as service_active,
    
    -- Ancien système (fallback)
    c.vehicle_type as legacy_vehicle_type,
    c.vehicle_class as legacy_vehicle_class,
    dp.service_type as legacy_service_type,
    
    -- Statut de migration
    c.migration_status,
    c.migrated_service_type,
    c.migrated_at,
    
    -- Service effectif (nouveau ou ancien)
    COALESCE(sc.service_name, c.migrated_service_type, 
             public.map_legacy_data_to_service(c.vehicle_type, c.vehicle_class, dp.service_type, dp.vehicle_class, c.delivery_capacity)) 
             as effective_service,
    
    -- Statut général
    CASE 
        WHEN dsa.id IS NOT NULL THEN 'migrated'
        WHEN c.migration_status = 'completed' THEN 'legacy_migrated'
        ELSE 'needs_migration'
    END as migration_status_computed

FROM public.chauffeurs c
LEFT JOIN public.driver_profiles dp ON c.user_id = dp.user_id
LEFT JOIN public.driver_service_associations dsa ON c.user_id = dsa.driver_id AND dsa.is_active = true
LEFT JOIN public.service_configurations sc ON dsa.service_id = sc.id
WHERE c.is_active = true;

-- RLS pour la vue
ALTER VIEW public.driver_service_status SET (security_invoker = true);

-- 6. FONCTION POUR VÉRIFIER LE STATUT DE MIGRATION
CREATE OR REPLACE FUNCTION public.get_migration_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    total_drivers integer;
    migrated_drivers integer;
    pending_drivers integer;
    error_drivers integer;
    result jsonb;
BEGIN
    -- Compter les chauffeurs
    SELECT COUNT(*) INTO total_drivers FROM public.chauffeurs WHERE is_active = true;
    
    SELECT COUNT(*) INTO migrated_drivers 
    FROM public.chauffeurs c
    JOIN public.driver_service_associations dsa ON c.user_id = dsa.driver_id
    WHERE c.is_active = true AND dsa.is_active = true;
    
    SELECT COUNT(*) INTO pending_drivers 
    FROM public.chauffeurs c
    LEFT JOIN public.driver_service_associations dsa ON c.user_id = dsa.driver_id
    WHERE c.is_active = true AND dsa.driver_id IS NULL;
    
    SELECT COUNT(*) INTO error_drivers 
    FROM public.data_migration_logs 
    WHERE migration_type = 'driver_service_migration' AND success = false;
    
    result := jsonb_build_object(
        'total_drivers', total_drivers,
        'migrated_drivers', migrated_drivers,
        'pending_drivers', pending_drivers,
        'error_drivers', error_drivers,
        'migration_percentage', 
            CASE WHEN total_drivers > 0 
            THEN ROUND((migrated_drivers::numeric / total_drivers * 100), 2)
            ELSE 0 END,
        'last_check', now()
    );
    
    RETURN result;
END;
$$;

-- 7. EXÉCUTER LA MIGRATION AUTOMATIQUEMENT
-- Migrer les chauffeurs existants
SELECT public.migrate_legacy_drivers_to_services() as migration_result;

-- 8. METTRE À JOUR LES CHAUFFEURS MIGRÉS
UPDATE public.chauffeurs 
SET 
    migration_status = 'completed',
    migrated_at = now(),
    migrated_service_type = (
        SELECT sc.service_name 
        FROM public.driver_service_associations dsa
        JOIN public.service_configurations sc ON dsa.service_id = sc.id
        WHERE dsa.driver_id = chauffeurs.user_id 
        AND dsa.is_active = true
        LIMIT 1
    )
WHERE user_id IN (
    SELECT driver_id 
    FROM public.driver_service_associations 
    WHERE is_active = true
);

-- 9. LOGS ET COMMENTAIRES
COMMENT ON FUNCTION public.migrate_legacy_drivers_to_services IS 
'Migration automatique des chauffeurs existants vers le nouveau système de services';

COMMENT ON FUNCTION public.map_legacy_data_to_service IS 
'Mapping intelligent des données legacy vers les nouveaux types de services';

COMMENT ON VIEW public.driver_service_status IS 
'Vue unifiée pour la compatibilité entre ancien et nouveau système de services';

-- 10. AUDIT DE LA MIGRATION
INSERT INTO public.security_audit_logs (
    user_id, action_type, resource_type, success, metadata
) VALUES (
    auth.uid(), 
    'data_migration', 
    'driver_services', 
    true,
    jsonb_build_object(
        'migration_phase', 'legacy_data_migration',
        'actions_performed', ARRAY[
            'legacy_drivers_migrated',
            'service_mapping_created',
            'compatibility_view_created',
            'migration_logging_enabled'
        ],
        'timestamp', now()
    )
);