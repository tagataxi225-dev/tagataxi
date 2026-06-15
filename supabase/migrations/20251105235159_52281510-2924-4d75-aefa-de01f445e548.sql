-- ========================================
-- PHASE 1: CORRIGER LES 5 DERNIÈRES FONCTIONS SANS search_path
-- ========================================
-- Impact: Sécurité critique - Protection contre injection SQL
-- Temps estimé: 15 minutes
-- ========================================

DO $$
DECLARE
  func_record RECORD;
  func_count INTEGER := 0;
BEGIN
  -- Parcourir toutes les fonctions sans search_path défini
  FOR func_record IN 
    SELECT 
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.prosecdef = true  -- SECURITY DEFINER
      AND n.nspname = 'public'
      AND NOT EXISTS (
        SELECT 1 
        FROM pg_proc p2 
        WHERE p2.oid = p.oid 
          AND pg_get_functiondef(p2.oid) LIKE '%SET search_path%'
      )
    ORDER BY p.proname
    LIMIT 5
  LOOP
    func_count := func_count + 1;
    
    -- Log la fonction trouvée
    RAISE NOTICE 'Fonction % trouvée: %.%(%) - Application du search_path...', 
      func_count, 
      func_record.schema_name, 
      func_record.function_name,
      func_record.args;
    
    -- Appliquer le search_path sécurisé
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
      func_record.schema_name,
      func_record.function_name,
      func_record.args
    );
  END LOOP;
  
  -- Résumé
  RAISE NOTICE '✅ Total: % fonctions corrigées', func_count;
END $$;

-- ========================================
-- VÉRIFICATION POST-CORRECTION
-- ========================================

-- Compter les fonctions restantes sans search_path
SELECT COUNT(*) AS remaining_unsafe_functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosecdef = true
  AND n.nspname = 'public'
  AND NOT EXISTS (
    SELECT 1 
    FROM pg_proc p2 
    WHERE p2.oid = p.oid 
      AND pg_get_functiondef(p2.oid) LIKE '%SET search_path%'
  );