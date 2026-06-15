-- ============================================
-- PHASE 4: MIGRATION LEGACY DRIVER_SERVICE_PREFERENCES
-- ============================================

-- 1. Ajouter colonne cancelled_at manquante dans transport_bookings
ALTER TABLE public.transport_bookings 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- 2. Créer index pour performance
CREATE INDEX IF NOT EXISTS idx_transport_bookings_cancelled_at 
ON public.transport_bookings(cancelled_at) 
WHERE cancelled_at IS NOT NULL;

-- 3. Migrer les données de driver_service_preferences vers chauffeurs
-- Copier service_types vers chauffeurs.service_type (prendre le premier type)
UPDATE public.chauffeurs c
SET service_type = COALESCE(
  (
    SELECT dsp.service_types[1]
    FROM public.driver_service_preferences dsp
    WHERE dsp.driver_id = c.user_id
    AND dsp.is_active = true
    LIMIT 1
  ),
  c.service_type,
  'delivery' -- Default
)
WHERE EXISTS (
  SELECT 1 FROM public.driver_service_preferences dsp
  WHERE dsp.driver_id = c.user_id
);

-- 4. Migrer vehicle_classes vers chauffeurs.vehicle_class
UPDATE public.chauffeurs c
SET vehicle_class = COALESCE(
  (
    SELECT dsp.vehicle_classes[1]
    FROM public.driver_service_preferences dsp
    WHERE dsp.driver_id = c.user_id
    AND dsp.is_active = true
    LIMIT 1
  ),
  c.vehicle_class,
  'standard' -- Default
)
WHERE EXISTS (
  SELECT 1 FROM public.driver_service_preferences dsp
  WHERE dsp.driver_id = c.user_id
);

-- 5. Migrer preferred_zones vers chauffeurs.service_areas
UPDATE public.chauffeurs c
SET service_areas = COALESCE(
  (
    SELECT dsp.preferred_zones
    FROM public.driver_service_preferences dsp
    WHERE dsp.driver_id = c.user_id
    AND dsp.is_active = true
    LIMIT 1
  ),
  c.service_areas,
  ARRAY['Kinshasa']::text[] -- Default
)
WHERE EXISTS (
  SELECT 1 FROM public.driver_service_preferences dsp
  WHERE dsp.driver_id = c.user_id
);

-- 6. Logger la migration
INSERT INTO public.data_migration_logs (
  migration_type,
  target_id,
  migration_data,
  success,
  created_by
)
SELECT 
  'driver_service_preferences_to_chauffeurs',
  c.user_id,
  jsonb_build_object(
    'service_types', dsp.service_types,
    'vehicle_classes', dsp.vehicle_classes,
    'preferred_zones', dsp.preferred_zones,
    'migrated_at', NOW()
  ),
  true,
  c.user_id
FROM public.chauffeurs c
INNER JOIN public.driver_service_preferences dsp ON dsp.driver_id = c.user_id
WHERE dsp.is_active = true;

-- 7. Marquer driver_service_preferences comme dépréciée
ALTER TABLE public.driver_service_preferences 
ADD COLUMN IF NOT EXISTS deprecated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deprecation_reason TEXT;

UPDATE public.driver_service_preferences
SET 
  deprecated = true,
  deprecated_at = NOW(),
  deprecation_reason = 'Migré vers table chauffeurs. Données consolidées pour simplification.'
WHERE is_active = true;

-- 8. Créer vue legacy pour compatibilité (read-only)
CREATE OR REPLACE VIEW public.driver_service_preferences_legacy AS
SELECT 
  c.user_id as driver_id,
  gen_random_uuid() as id,
  ARRAY[c.service_type]::text[] as service_types,
  ARRAY[c.vehicle_class]::text[] as vehicle_classes,
  c.service_areas as preferred_zones,
  c.is_active,
  c.created_at,
  c.updated_at
FROM public.chauffeurs c
WHERE c.is_active = true;

-- 9. Commentaires
COMMENT ON VIEW public.driver_service_preferences_legacy IS 
'Vue legacy read-only pour compatibilité. Les données réelles sont dans chauffeurs.';

COMMENT ON COLUMN public.transport_bookings.cancelled_at IS 
'Date/heure d''annulation de la course (corrige erreur cron jobs)';
