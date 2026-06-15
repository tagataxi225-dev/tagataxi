-- ==============================================
-- MIGRATION DES DONNÉES CORRIGÉE FINALE - PHASE 2
-- ==============================================

-- 1. Nettoyer d'abord les tables si elles existent déjà partiellement
DROP TABLE IF EXISTS public.driver_service_associations CASCADE;
DROP TABLE IF EXISTS public.data_migration_logs CASCADE;

-- 2. CRÉER LA TABLE driver_service_associations 
CREATE TABLE public.driver_service_associations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id uuid NOT NULL,
    service_id uuid NOT NULL REFERENCES public.service_configurations(id),
    assigned_at timestamp with time zone DEFAULT now(),
    assigned_by uuid,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending_verification', 'suspended')),
    is_active boolean DEFAULT true,
    notes text,
    migration_source text DEFAULT 'manual',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Contrainte unique
CREATE UNIQUE INDEX idx_driver_service_unique_active 
    ON public.driver_service_associations(driver_id) 
    WHERE is_active = true;

-- Index pour les performances
CREATE INDEX idx_driver_service_associations_driver_id ON public.driver_service_associations(driver_id);
CREATE INDEX idx_driver_service_associations_service_id ON public.driver_service_associations(service_id);

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

-- 3. CRÉER LA TABLE DE LOGS DE MIGRATION
CREATE TABLE public.data_migration_logs (
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

-- 4. FONCTION DE MAPPING CORRIGÉE
CREATE OR REPLACE FUNCTION public.map_legacy_data_to_service(
    p_vehicle_type text DEFAULT NULL,
    p_delivery_capacity text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = 'public'
AS $$
BEGIN
    -- Prioriser delivery_capacity si présent
    IF p_delivery_capacity IS NOT NULL THEN
        CASE LOWER(p_delivery_capacity)
            WHEN 'light', 'small', 'leger' THEN RETURN 'delivery_flash';
            WHEN 'medium', 'standard', 'moyen' THEN RETURN 'delivery_flex';
            WHEN 'large', 'heavy', 'gros', 'lourd' THEN RETURN 'delivery_maxicharge';
            ELSE RETURN 'delivery_flex';
        END CASE;
    END IF;
    
    -- Mapper selon vehicle_type
    IF p_vehicle_type IS NOT NULL THEN
        CASE LOWER(p_vehicle_type)
            WHEN 'moto', 'motorcycle', 'bike', 'motorbike' THEN RETURN 'moto_transport';
            WHEN 'delivery', 'van', 'truck', 'livraison' THEN RETURN 'delivery_flex';
            WHEN 'taxi', 'car', 'voiture' THEN RETURN 'taxi_standard';
            WHEN 'premium', 'luxury', 'luxe' THEN RETURN 'taxi_premium';
            WHEN 'comfort', 'confort' THEN RETURN 'taxi_confort';
            WHEN 'economic', 'eco', 'economique' THEN RETURN 'taxi_eco';
            ELSE RETURN 'taxi_standard';
        END CASE;
    END IF;
    
    -- Par défaut
    RETURN 'taxi_standard';
END;
$$;

-- 5. AJOUTER COLONNES DE COMPATIBILITÉ DANS CHAUFFEURS
ALTER TABLE public.chauffeurs 
ADD COLUMN IF NOT EXISTS migrated_service_type text,
ADD COLUMN IF NOT EXISTS migration_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS migrated_at timestamp with time zone;

-- 6. MIGRER LES CHAUFFEURS EXISTANTS (AVEC LES BONNES COLONNES)
DO $$
DECLARE
    driver_record RECORD;
    service_id uuid;
    service_type_name text;
    migrated_count integer := 0;
BEGIN
    -- Parcourir tous les chauffeurs actifs
    FOR driver_record IN 
        SELECT 
            c.user_id,
            c.vehicle_type,
            c.delivery_capacity,
            c.verification_status
        FROM public.chauffeurs c
        WHERE c.is_active = true
    LOOP
        -- Déterminer le service approprié
        service_type_name := public.map_legacy_data_to_service(
            driver_record.vehicle_type,
            driver_record.delivery_capacity
        );
        
        -- Récupérer l'ID du service en utilisant service_type
        SELECT id INTO service_id
        FROM public.service_configurations
        WHERE service_type = service_type_name AND is_active = true
        LIMIT 1;
        
        -- Si le service n'existe pas, utiliser taxi_standard par défaut
        IF service_id IS NULL THEN
            SELECT id INTO service_id
            FROM public.service_configurations
            WHERE service_type = 'taxi_standard' AND is_active = true
            LIMIT 1;
            service_type_name := 'taxi_standard';
        END IF;
        
        -- Créer l'association de service si service trouvé
        IF service_id IS NOT NULL THEN
            BEGIN
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
                        service_type_name),
                    'legacy_migration'
                );
                
                migrated_count := migrated_count + 1;
            EXCEPTION WHEN unique_violation THEN
                -- Ignorer si déjà migré
                NULL;
            END;
        END IF;
    END LOOP;
    
    -- Logger le résultat
    INSERT INTO public.data_migration_logs (
        migration_type, success, migration_data
    ) VALUES (
        'driver_service_migration', 
        true,
        jsonb_build_object(
            'migrated_drivers', migrated_count,
            'timestamp', now()
        )
    );
END $$;

-- 7. METTRE À JOUR LES CHAUFFEURS MIGRÉS (AVEC LES BONNES COLONNES)
UPDATE public.chauffeurs 
SET 
    migration_status = 'completed',
    migrated_at = now(),
    migrated_service_type = (
        SELECT sc.service_type 
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

-- 8. FONCTION POUR VÉRIFIER LE STATUT DE MIGRATION
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

-- 9. CRÉER UNE VUE POUR LA COMPATIBILITÉ (AVEC LES BONNES COLONNES)
CREATE OR REPLACE VIEW public.driver_service_status AS
SELECT 
    c.user_id as driver_id,
    c.display_name,
    c.email,
    c.is_active as driver_active,
    c.verification_status,
    
    -- Nouveau système (prioritaire)
    sc.service_type as current_service,
    sc.service_category,
    sc.display_name as service_display_name,
    dsa.status as service_status,
    dsa.assigned_at as service_assigned_at,
    
    -- Ancien système (fallback)
    c.vehicle_type as legacy_vehicle_type,
    c.delivery_capacity as legacy_delivery_capacity,
    
    -- Statut de migration
    c.migration_status,
    c.migrated_service_type,
    c.migrated_at,
    
    -- Service effectif
    COALESCE(sc.service_type, c.migrated_service_type, 'taxi_standard') as effective_service

FROM public.chauffeurs c
LEFT JOIN public.driver_service_associations dsa ON c.user_id = dsa.driver_id AND dsa.is_active = true
LEFT JOIN public.service_configurations sc ON dsa.service_id = sc.id
WHERE c.is_active = true;

-- 10. AUDIT DE LA MIGRATION
INSERT INTO public.security_audit_logs (
    user_id, action_type, resource_type, success, metadata
) VALUES (
    auth.uid(), 
    'data_migration', 
    'driver_services', 
    true,
    jsonb_build_object(
        'migration_phase', 'data_migration_final_success',
        'timestamp', now()
    )
);

-- 11. AFFICHER LE STATUT DE MIGRATION
SELECT public.get_migration_status() as migration_result;