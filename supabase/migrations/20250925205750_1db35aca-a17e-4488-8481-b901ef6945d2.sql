-- Correction finale des problèmes de production

-- 1. Corriger l'accès à la géolocalisation IP 
DROP POLICY IF EXISTS "ip_geolocation_cache_admin_only" ON public.ip_geolocation_cache;

CREATE POLICY "ip_geolocation_cache_authenticated_read" 
ON public.ip_geolocation_cache 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "ip_geolocation_cache_system_insert" 
ON public.ip_geolocation_cache 
FOR INSERT 
WITH CHECK (true);

-- 2. Corriger la contrainte user_id sur activity_logs
ALTER TABLE public.activity_logs ALTER COLUMN user_id DROP NOT NULL;

-- 3. Créer une fonction pour les logs système
CREATE OR REPLACE FUNCTION public.log_system_activity(
  p_activity_type text,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.activity_logs (
    user_id, activity_type, description, metadata
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    p_activity_type, 
    p_description, 
    p_metadata
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- 4. Corriger l'accès aux lieux intelligents - éviter le conflit de politique
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'intelligent_places_public_read' AND tablename = 'intelligent_places') THEN
    EXECUTE 'CREATE POLICY "intelligent_places_public_read" ON public.intelligent_places FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL)';
  END IF;
END
$$;

-- 5. Permettre l'accès aux tarifs pour les utilisateurs authentifiés
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'delivery_pricing_config_authenticated_read' AND tablename = 'delivery_pricing_config') THEN
    EXECUTE 'CREATE POLICY "delivery_pricing_config_authenticated_read" ON public.delivery_pricing_config FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL)';
  END IF;
END
$$;

-- 6. Log de correction finale
SELECT public.log_system_activity(
  'production_final_fixes',
  'Corrections finales appliquées - géolocalisation et contraintes',
  jsonb_build_object(
    'timestamp', now(),
    'fixes_applied', ARRAY[
      'ip_geolocation_access_restored',
      'activity_logs_user_id_made_nullable',
      'system_logging_function_created',
      'intelligent_places_access_secured',
      'pricing_config_access_enabled'
    ],
    'status', 'production_ready'
  )
);