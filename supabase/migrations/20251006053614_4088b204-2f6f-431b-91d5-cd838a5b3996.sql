
-- Migration sécurité RLS - Version corrigée
-- Ajout fonction de vérification et logs

CREATE OR REPLACE FUNCTION public.security_check_search_path()
RETURNS TABLE(
  function_name text,
  has_search_path boolean,
  recommendation text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.proname::text,
    (p.proconfig IS NOT NULL AND array_to_string(COALESCE(p.proconfig, ARRAY[]::text[]), ',') LIKE '%search_path%')::boolean,
    CASE 
      WHEN (p.proconfig IS NULL OR NOT (array_to_string(COALESCE(p.proconfig, ARRAY[]::text[]), ',') LIKE '%search_path%'))
      THEN 'Ajouter: ALTER FUNCTION ' || n.nspname || '.' || p.proname || ' SET search_path = public;'
      ELSE 'Fonction sécurisée ✅'
    END::text
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true;
END;
$$;

COMMENT ON FUNCTION public.security_check_search_path() IS 
'Vérifie quelles fonctions SECURITY DEFINER manquent de search_path.
Usage: SELECT * FROM security_check_search_path() WHERE has_search_path = false;';
