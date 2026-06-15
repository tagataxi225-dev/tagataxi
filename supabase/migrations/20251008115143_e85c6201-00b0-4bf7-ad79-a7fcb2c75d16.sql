-- ============================================================
-- MIGRATION: Correction Bugs Critiques #1 et #2 (v2)
-- ============================================================

-- ============================================================
-- BUG #1: Nettoyage des données orphelines + Foreign Key
-- ============================================================

-- 1. Identifier et supprimer les driver_locations orphelines
DELETE FROM public.driver_locations 
WHERE driver_id NOT IN (SELECT user_id FROM public.chauffeurs);

-- 2. Créer la foreign key maintenant que les données sont propres
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'driver_locations_driver_id_fkey'
  ) THEN
    ALTER TABLE public.driver_locations 
    ADD CONSTRAINT driver_locations_driver_id_fkey 
    FOREIGN KEY (driver_id) REFERENCES public.chauffeurs(user_id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key driver_locations_driver_id_fkey créée avec succès';
  ELSE
    RAISE NOTICE 'Foreign key driver_locations_driver_id_fkey existe déjà';
  END IF;
END $$;

-- ============================================================
-- BUG #2: UUID invalides dans activity_logs
-- ============================================================

-- 1. Supprimer les logs avec UUID invalides (nettoyage)
DELETE FROM public.activity_logs 
WHERE user_id::text LIKE 'ip:%' 
   OR user_id::text LIKE 'test-%';

-- 2. Supprimer les logs qui pointent vers des users inexistants
DELETE FROM public.activity_logs 
WHERE user_id IS NOT NULL 
  AND user_id != '00000000-0000-0000-0000-000000000000'::uuid
  AND user_id NOT IN (SELECT id FROM auth.users);

-- 3. Modifier la colonne pour accepter NULL
ALTER TABLE public.activity_logs 
ALTER COLUMN user_id DROP NOT NULL;

-- 4. Définir un UUID système par défaut
ALTER TABLE public.activity_logs 
ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;

-- 5. Créer fonction de validation des UUID
CREATE OR REPLACE FUNCTION public.validate_activity_log_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si user_id est invalide, utiliser UUID système
  IF NEW.user_id IS NULL 
     OR NEW.user_id::text LIKE 'ip:%' 
     OR NEW.user_id::text LIKE 'test-%' THEN
    NEW.user_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Créer le trigger
DROP TRIGGER IF EXISTS validate_activity_log_user_id_trigger ON public.activity_logs;
CREATE TRIGGER validate_activity_log_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_activity_log_user_id();

-- ============================================================
-- RAPPORT POST-MIGRATION
-- ============================================================
DO $$ 
DECLARE
  orphan_locations INTEGER;
  invalid_logs INTEGER;
  system_logs INTEGER;
BEGIN
  -- Vérifier qu'il n'y a plus de locations orphelines
  SELECT COUNT(*) INTO orphan_locations
  FROM public.driver_locations dl
  WHERE NOT EXISTS (SELECT 1 FROM public.chauffeurs c WHERE c.user_id = dl.driver_id);
  
  -- Vérifier qu'il n'y a plus de logs invalides
  SELECT COUNT(*) INTO invalid_logs
  FROM public.activity_logs
  WHERE user_id::text LIKE 'ip:%' OR user_id::text LIKE 'test-%';
  
  -- Compter les logs système
  SELECT COUNT(*) INTO system_logs
  FROM public.activity_logs
  WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;
  
  RAISE NOTICE '=== RAPPORT MIGRATION ===';
  RAISE NOTICE 'Locations orphelines restantes: %', orphan_locations;
  RAISE NOTICE 'Logs avec UUID invalides: %', invalid_logs;
  RAISE NOTICE 'Logs système (UUID 00000000): %', system_logs;
  RAISE NOTICE '========================';
END $$;