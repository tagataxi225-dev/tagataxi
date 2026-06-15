-- ============================================================
-- ACTION 1: Restructuration complète du système de location
-- ============================================================

-- 1.1 Créer la table driver_equipment_types pour équipements chauffeur
CREATE TABLE IF NOT EXISTS public.driver_equipment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('safety', 'technology', 'communication', 'presentation')),
  icon TEXT,
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS sur driver_equipment_types
ALTER TABLE public.driver_equipment_types ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire, seuls les admins peuvent modifier
CREATE POLICY "driver_equipment_public_read" ON public.driver_equipment_types
  FOR SELECT USING (true);

CREATE POLICY "driver_equipment_admin_manage" ON public.driver_equipment_types
  FOR ALL USING (is_current_user_admin());

-- Insérer les équipements chauffeurs de base
INSERT INTO public.driver_equipment_types (name, category, icon, description, is_required) VALUES
('Permis de conduire valide', 'safety', 'IdCard', 'Permis de conduire professionnel valide', true),
('Assurance responsabilité', 'safety', 'Shield', 'Assurance professionnelle chauffeur', true),
('GPS personnel', 'technology', 'Navigation', 'Appareil GPS portatif pour navigation', false),
('Téléphone professionnel', 'communication', 'Phone', 'Numéro joignable 24/7', true),
('Tenue professionnelle', 'presentation', 'User', 'Uniforme propre et soigné', false)
ON CONFLICT DO NOTHING;

-- 1.2 Modifier rental_vehicles pour supporter avec/sans chauffeur
ALTER TABLE public.rental_vehicles
  ADD COLUMN IF NOT EXISTS driver_available BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS driver_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS with_driver_daily_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS with_driver_hourly_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS with_driver_weekly_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS without_driver_daily_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS without_driver_hourly_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS without_driver_weekly_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS driver_equipment JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS vehicle_equipment JSONB DEFAULT '[]'::jsonb;

-- Migrer les données existantes vers les nouveaux champs
UPDATE public.rental_vehicles SET
  without_driver_daily_rate = COALESCE(daily_rate, 0),
  without_driver_hourly_rate = COALESCE(hourly_rate, 0),
  without_driver_weekly_rate = COALESCE(weekly_rate, 0),
  vehicle_equipment = COALESCE(equipment, '[]'::jsonb),
  driver_equipment = '[]'::jsonb
WHERE without_driver_daily_rate = 0;

-- 1.3 Renommer rental_equipment_types en vehicle_equipment_types
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'rental_equipment_types'
  ) AND NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'vehicle_equipment_types'
  ) THEN
    ALTER TABLE public.rental_equipment_types RENAME TO vehicle_equipment_types;
  END IF;
END
$$;

-- Commenter l'ancienne colonne equipment (on garde pour compatibilité)
COMMENT ON COLUMN public.rental_vehicles.equipment IS 'DEPRECATED: Utiliser vehicle_equipment à la place';
COMMENT ON COLUMN public.rental_vehicles.daily_rate IS 'DEPRECATED: Utiliser without_driver_daily_rate ou with_driver_daily_rate';
COMMENT ON COLUMN public.rental_vehicles.hourly_rate IS 'DEPRECATED: Utiliser without_driver_hourly_rate ou with_driver_hourly_rate';
COMMENT ON COLUMN public.rental_vehicles.weekly_rate IS 'DEPRECATED: Utiliser without_driver_weekly_rate ou with_driver_weekly_rate';

-- Ajouter un index sur driver_available pour performance
CREATE INDEX IF NOT EXISTS idx_rental_vehicles_driver_available 
  ON public.rental_vehicles(driver_available) 
  WHERE driver_available = true;

-- Log de migration
INSERT INTO public.activity_logs (
  user_id,
  activity_type,
  description,
  metadata
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'database_migration',
  'Migration système location avec/sans chauffeur complétée',
  jsonb_build_object(
    'migration_version', '2025-01-rental-driver-options',
    'tables_modified', ARRAY['rental_vehicles', 'driver_equipment_types'],
    'timestamp', NOW()
  )
);