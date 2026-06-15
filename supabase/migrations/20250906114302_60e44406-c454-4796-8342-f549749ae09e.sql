-- ==============================================
-- CRÉATION TABLE MANQUANTE ET MIGRATION - PHASE 2
-- ==============================================

-- 1. CRÉER LA TABLE driver_service_associations MANQUANTE
CREATE TABLE IF NOT EXISTS public.driver_service_associations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id uuid NOT NULL,
    service_id uuid NOT NULL REFERENCES public.service_configurations(id),
    assigned_at timestamp with time zone DEFAULT now(),
    assigned_by uuid,
    status text DEFAULT 'active'::text CHECK (status IN ('active', 'inactive', 'pending_verification', 'suspended')),
    is_active boolean DEFAULT true,
    notes text,
    migration_source text DEFAULT 'manual',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Contrainte unique : un chauffeur ne peut avoir qu'un seul service actif à la fois
    UNIQUE(driver_id, is_active) WHERE is_active = true
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_driver_service_associations_driver_id ON public.driver_service_associations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_service_associations_service_id ON public.driver_service_associations(service_id);
CREATE INDEX IF NOT EXISTS idx_driver_service_associations_status ON public.driver_service_associations(status);

-- Enable RLS
ALTER TABLE public.driver_service_associations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "driver_service_associations_driver_access" 
    ON public.driver_service_associations FOR ALL 
    USING (auth.uid() = driver_id)
    WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "driver_service_associations_admin_access" 
    ON public.driver_service_associations FOR ALL 
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_driver_service_associations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_driver_service_associations_updated_at
    BEFORE UPDATE ON public.driver_service_associations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_driver_service_associations_updated_at();

-- 2. CRÉER LA TABLE DE LOGS DE MIGRATION
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

-- 3. FONCTION DE MAPPING DES DONNÉES LEGACY VERS LES NOUVEAUX SERVICES
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
SET search_path = 'public'
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

-- 4. FONCTION SIMPLE DE MIGRATION
CREATE OR REPLACE FUNCTION public.migrate_existing_drivers()
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
    -- Parcourir tous les chauffeurs actifs sans association de service
    FOR driver_record IN 
        SELECT 
            c.user_id,
            c.vehicle_type,
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
            -- Déterminer le service approprié
            service_name := public.map_legacy_data_to_service(
                driver_record.vehicle_type,
                driver_record.profile_vehicle_class,
                driver_record.profile_service_type,
                driver_record.profile_vehicle_class,
                NULL
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
                status,
                is_active,
                notes,
                migration_source
            ) VALUES (
                driver_record.user_id,
                service_id,
                now(),
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
                migration_type, target_id, success, error_message, migration_data
            ) VALUES (
                'driver_service_migration', 
                driver_record.user_id, 
                false,
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
        'timestamp', now()
    );
    
    RETURN migration_result;
END;
$$;

-- 5. AJOUTER COLONNES DE COMPATIBILITÉ DANS CHAUFFEURS
ALTER TABLE public.chauffeurs 
ADD COLUMN IF NOT EXISTS migrated_service_type text,
ADD COLUMN IF NOT EXISTS migration_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS migrated_at timestamp with time zone;

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
    
    result := jsonb_build_object(
        'total_drivers', total_drivers,
        'migrated_drivers', migrated_drivers,
        'pending_drivers', pending_drivers,
        'migration_percentage', 
            CASE WHEN total_drivers > 0 
            THEN ROUND((migrated_drivers::numeric / total_drivers * 100), 2)
            ELSE 0 END,
        'last_check', now()
    );
    
    RETURN result;
END;
$$;

-- 7. EXÉCUTER LA MIGRATION
SELECT public.migrate_existing_drivers() as migration_result;

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

-- 9. AUDIT DE LA MIGRATION
INSERT INTO public.security_audit_logs (
    user_id, action_type, resource_type, success, metadata
) VALUES (
    auth.uid(), 
    'data_migration', 
    'driver_services', 
    true,
    jsonb_build_object(
        'migration_phase', 'data_migration_complete',
        'timestamp', now()
    )
);