-- ========================================
-- MIGRATION SÉCURITÉ PHASE 1 - CORRECTIONS CONSOLIDÉES
-- Date: 2025-10-16
-- Objectif: Corriger tous les points de sécurité identifiés
-- ========================================

-- ========================================
-- 1. ACTIVER RLS SUR TABLE AUDIT
-- ========================================

-- Activer RLS sur security_definer_views_audit
ALTER TABLE public.security_definer_views_audit 
ENABLE ROW LEVEL SECURITY;

-- Politique: Seuls les admins peuvent accéder
CREATE POLICY "admin_only_view_security_audit"
ON public.security_definer_views_audit 
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'::user_role
      AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'::user_role
      AND is_active = true
  )
);

COMMENT ON POLICY "admin_only_view_security_audit" ON public.security_definer_views_audit 
IS 'Seuls les administrateurs peuvent accéder à la table d''audit des vues SECURITY DEFINER';


-- ========================================
-- 2. CORRIGER search_path FONCTIONS TEST
-- ========================================

-- Corriger check_test_account_exists
ALTER FUNCTION public.check_test_account_exists(text) 
SET search_path = public;

-- Corriger create_test_driver_profile
ALTER FUNCTION public.create_test_driver_profile(uuid, text, text, text) 
SET search_path = public;

-- Corriger create_test_partner_profile
ALTER FUNCTION public.create_test_partner_profile(uuid, text, text, text) 
SET search_path = public;


-- ========================================
-- 3. FONCTIONS DE DIAGNOSTIC ET AUDIT
-- ========================================

-- Fonction pour lister toutes les fonctions SECURITY DEFINER sans search_path
CREATE OR REPLACE FUNCTION public.audit_functions_without_search_path()
RETURNS TABLE(
  function_name text,
  schema_name text,
  arguments text,
  owner text,
  priority text,
  fix_command text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.proname::text as function_name,
    n.nspname::text as schema_name,
    pg_get_function_identity_arguments(p.oid)::text as arguments,
    pg_get_userbyid(p.proowner)::text as owner,
    -- Déterminer la priorité
    CASE
      WHEN p.proname ILIKE '%admin%' OR p.proname ILIKE '%auth%' OR p.proname ILIKE '%role%' THEN '🔴 CRITIQUE'
      WHEN p.proname ILIKE '%test%' OR p.proname ILIKE '%seed%' THEN '🟢 TEST/DEV'
      ELSE '🟡 À ÉVALUER'
    END::text as priority,
    -- Générer la commande de correction
    format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public;',
      n.nspname,
      p.proname,
      pg_get_function_identity_arguments(p.oid)
    )::text as fix_command
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND (p.proconfig IS NULL OR NOT p.proconfig::text LIKE '%search_path%')
  ORDER BY 
    CASE
      WHEN p.proname ILIKE '%admin%' OR p.proname ILIKE '%auth%' THEN 1
      WHEN p.proname ILIKE '%test%' THEN 3
      ELSE 2
    END,
    p.proname;
$$;

COMMENT ON FUNCTION public.audit_functions_without_search_path() 
IS 'Liste toutes les fonctions SECURITY DEFINER sans search_path configuré, avec priorité et commande de correction';


-- Fonction pour lister les vues SECURITY DEFINER (si présentes)
CREATE OR REPLACE FUNCTION public.audit_security_definer_views()
RETURNS TABLE(
  schema_name text,
  view_name text,
  owner text,
  definition_preview text,
  fix_recommendation text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    schemaname::text,
    viewname::text,
    viewowner::text,
    LEFT(definition, 200)::text as definition_preview,
    format(
      'DROP VIEW IF EXISTS %I.%I; CREATE VIEW %I.%I WITH (security_invoker = true) AS %s',
      schemaname,
      viewname,
      schemaname,
      viewname,
      '-- Copier la définition originale ici'
    )::text as fix_recommendation
  FROM pg_views
  WHERE schemaname = 'public'
    AND (
      definition ILIKE '%security%definer%' 
      OR definition ILIKE '%security_definer%'
    )
  ORDER BY schemaname, viewname;
$$;

COMMENT ON FUNCTION public.audit_security_definer_views() 
IS 'Liste toutes les vues avec SECURITY DEFINER (vulnérabilité potentielle de bypass RLS)';


-- Fonction de correction automatique des search_path
CREATE OR REPLACE FUNCTION public.auto_fix_function_search_paths()
RETURNS TABLE(
  function_fixed text,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  func_record RECORD;
  fixed_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  -- Vérifier que c'est un admin qui exécute
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'::user_role
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Parcourir toutes les fonctions vulnérables
  FOR func_record IN 
    SELECT 
      p.proname,
      n.nspname,
      pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND (p.proconfig IS NULL OR NOT p.proconfig::text LIKE '%search_path%')
  LOOP
    BEGIN
      -- Ajouter search_path
      EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = public',
        func_record.nspname,
        func_record.proname,
        func_record.args
      );
      
      fixed_count := fixed_count + 1;
      
      RETURN QUERY SELECT 
        format('%I.%I(%s)', func_record.nspname, func_record.proname, func_record.args)::text,
        '✅ FIXED'::text;
        
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      
      RETURN QUERY SELECT 
        format('%I.%I(%s)', func_record.nspname, func_record.proname, func_record.args)::text,
        format('❌ ERROR: %s', SQLERRM)::text;
    END;
  END LOOP;

  -- Résumé final
  RETURN QUERY SELECT 
    format('TOTAL: %s fixed, %s errors', fixed_count, error_count)::text,
    '📊 SUMMARY'::text;
    
  -- Logger l'opération
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'security_auto_fix',
    'Auto-correction search_path des fonctions SECURITY DEFINER',
    jsonb_build_object(
      'fixed_count', fixed_count,
      'error_count', error_count,
      'timestamp', now()
    )
  );
END;
$$;

COMMENT ON FUNCTION public.auto_fix_function_search_paths() 
IS 'Corrige automatiquement le search_path de toutes les fonctions SECURITY DEFINER vulnérables (admin only)';


-- Fonction de rapport de diagnostic global
CREATE OR REPLACE FUNCTION public.security_diagnostic_report()
RETURNS TABLE(
  check_category text,
  status text,
  details text,
  action_required text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rls_disabled_count INTEGER;
  vulnerable_functions_count INTEGER;
  security_definer_views_count INTEGER;
BEGIN
  -- Vérifier que c'est un admin qui exécute
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'::user_role
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- 1. Vérifier RLS sur toutes les tables
  SELECT COUNT(*) INTO rls_disabled_count
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND rowsecurity = false;

  RETURN QUERY SELECT 
    '1. Row Level Security'::text,
    CASE 
      WHEN rls_disabled_count = 0 THEN '✅ EXCELLENT'
      WHEN rls_disabled_count <= 2 THEN '⚠️ BON'
      ELSE '❌ À CORRIGER'
    END::text,
    format('%s table(s) sans RLS activée', rls_disabled_count)::text,
    CASE 
      WHEN rls_disabled_count > 0 THEN 'Activer RLS sur toutes les tables sensibles'
      ELSE 'Aucune action requise'
    END::text;

  -- 2. Vérifier fonctions sans search_path
  SELECT COUNT(*) INTO vulnerable_functions_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND (p.proconfig IS NULL OR NOT p.proconfig::text LIKE '%search_path%');

  RETURN QUERY SELECT 
    '2. SECURITY DEFINER Functions'::text,
    CASE 
      WHEN vulnerable_functions_count = 0 THEN '✅ PARFAIT'
      WHEN vulnerable_functions_count <= 5 THEN '⚠️ À OPTIMISER'
      ELSE '❌ VULNÉRABLE'
    END::text,
    format('%s fonction(s) sans search_path configuré', vulnerable_functions_count)::text,
    CASE 
      WHEN vulnerable_functions_count > 0 THEN 'Exécuter: SELECT * FROM auto_fix_function_search_paths();'
      ELSE 'Aucune action requise'
    END::text;

  -- 3. Vérifier vues SECURITY DEFINER
  SELECT COUNT(*) INTO security_definer_views_count
  FROM pg_views
  WHERE schemaname = 'public'
    AND (definition ILIKE '%security%definer%' OR definition ILIKE '%security_definer%');

  RETURN QUERY SELECT 
    '3. SECURITY DEFINER Views'::text,
    CASE 
      WHEN security_definer_views_count = 0 THEN '✅ PARFAIT'
      ELSE '❌ VULNÉRABLE'
    END::text,
    format('%s vue(s) avec SECURITY DEFINER détectée(s)', security_definer_views_count)::text,
    CASE 
      WHEN security_definer_views_count > 0 THEN 'Exécuter: SELECT * FROM audit_security_definer_views(); et corriger manuellement'
      ELSE 'Aucune action requise'
    END::text;

  -- 4. État global
  RETURN QUERY SELECT 
    '4. Score Global de Sécurité'::text,
    CASE 
      WHEN rls_disabled_count = 0 AND vulnerable_functions_count = 0 AND security_definer_views_count = 0 
        THEN '✅ 10/10 EXCELLENT'
      WHEN rls_disabled_count <= 1 AND vulnerable_functions_count <= 5 AND security_definer_views_count = 0 
        THEN '✅ 9/10 TRÈS BON'
      WHEN rls_disabled_count <= 2 AND vulnerable_functions_count <= 10 
        THEN '⚠️ 7-8/10 BON'
      ELSE '❌ 5-6/10 À AMÉLIORER'
    END::text,
    'Basé sur RLS, fonctions sécurisées, et absence de vues SECURITY DEFINER'::text,
    'Consulter les détails ci-dessus pour les actions spécifiques'::text;
END;
$$;

COMMENT ON FUNCTION public.security_diagnostic_report() 
IS 'Génère un rapport complet de diagnostic de sécurité (RLS, fonctions, vues) - Admin only';


-- ========================================
-- 4. VÉRIFICATIONS POST-MIGRATION
-- ========================================

-- Vérifier que RLS est activée sur security_definer_views_audit
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename = 'security_definer_views_audit';
  
  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'ERREUR: RLS non activée sur security_definer_views_audit';
  END IF;
  
  RAISE NOTICE '✅ RLS activée avec succès sur security_definer_views_audit';
END $$;

-- Vérifier que les 3 fonctions test ont search_path
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM pg_proc p
  WHERE p.proname IN ('check_test_account_exists', 'create_test_driver_profile', 'create_test_partner_profile')
    AND p.prosecdef = true
    AND (p.proconfig IS NULL OR NOT p.proconfig::text LIKE '%search_path%');
  
  IF missing_count > 0 THEN
    RAISE WARNING 'ATTENTION: % fonction(s) test n''ont pas search_path configuré', missing_count;
  ELSE
    RAISE NOTICE '✅ Toutes les fonctions test ont search_path configuré';
  END IF;
END $$;


-- ========================================
-- 5. INSTRUCTIONS POST-MIGRATION
-- ========================================

-- Logger la migration
INSERT INTO public.activity_logs (
  user_id,
  activity_type,
  description,
  metadata
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'security_migration',
  'Migration de sécurité Phase 1 appliquée',
  jsonb_build_object(
    'migration_date', now(),
    'fixes_applied', jsonb_build_array(
      'RLS activée sur security_definer_views_audit',
      'search_path corrigé pour 3 fonctions test',
      'Fonctions de diagnostic créées',
      'Auto-fix disponible pour fonctions restantes'
    )
  )
);

-- Afficher les instructions finales
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION PHASE 1 TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PROCHAINES ÉTAPES RECOMMANDÉES:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Vérifier l''état de sécurité global:';
  RAISE NOTICE '   SELECT * FROM security_diagnostic_report();';
  RAISE NOTICE '';
  RAISE NOTICE '2. Lister les fonctions encore vulnérables:';
  RAISE NOTICE '   SELECT * FROM audit_functions_without_search_path();';
  RAISE NOTICE '';
  RAISE NOTICE '3. Corriger automatiquement les fonctions restantes (admin only):';
  RAISE NOTICE '   SELECT * FROM auto_fix_function_search_paths();';
  RAISE NOTICE '';
  RAISE NOTICE '4. Vérifier les vues SECURITY DEFINER (si présentes):';
  RAISE NOTICE '   SELECT * FROM audit_security_definer_views();';
  RAISE NOTICE '';
  RAISE NOTICE '5. DASHBOARD SUPABASE (configuration manuelle):';
  RAISE NOTICE '   - Activer "Leaked Password Protection" (Auth > Settings)';
  RAISE NOTICE '   - Planifier upgrade Postgres (Infrastructure > Database)';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;