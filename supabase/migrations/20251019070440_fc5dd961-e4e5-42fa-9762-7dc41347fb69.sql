-- ✅ PHASE 1 : Sécuriser les RLS policies contre auth.uid() NULL

-- Créer une fonction helper sécurisée pour récupérer auth.uid()
CREATE OR REPLACE FUNCTION public.safe_auth_uid()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
$$;

COMMENT ON FUNCTION public.safe_auth_uid() IS 'Retourne auth.uid() ou un UUID par défaut si NULL. Évite les erreurs "invalid input syntax for type uuid" dans les RLS policies.';

-- Améliorer la fonction get_user_roles pour gérer les cas où auth.uid() est NULL
CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id uuid)
RETURNS TABLE(role text, admin_role text, permissions text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- ✅ PROTECTION : Vérifier que auth.uid() n'est pas NULL
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required: session not initialized. Please refresh the page or log in again.';
  END IF;

  -- Vérification de sécurité : seul l'utilisateur ou un admin peut accéder aux rôles
  IF p_user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::user_role
      AND ur.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Cannot access other user roles';
  END IF;

  RETURN QUERY
  SELECT 
    ur.role::text,
    ur.admin_role::text,
    COALESCE(
      CASE ur.role::text
        WHEN 'admin' THEN ARRAY['system_admin', 'user_management', 'content_moderation']
        WHEN 'restaurant' THEN ARRAY['restaurant_manage', 'menu_manage', 'order_manage']
        WHEN 'driver' THEN ARRAY['transport_manage', 'delivery_manage']
        WHEN 'partner' THEN ARRAY['fleet_management', 'driver_management']
        WHEN 'client' THEN ARRAY['transport_read', 'marketplace_read']
        ELSE ARRAY['basic_access']
      END,
      ARRAY['basic_access']
    ) as permissions
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id 
    AND ur.is_active = true
  ORDER BY 
    CASE ur.role::text
      WHEN 'admin' THEN 1
      WHEN 'restaurant' THEN 2
      WHEN 'partner' THEN 3  
      WHEN 'driver' THEN 4
      WHEN 'client' THEN 5
      ELSE 6
    END;
END;
$$;