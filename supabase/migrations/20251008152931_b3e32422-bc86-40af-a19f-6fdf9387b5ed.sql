-- Migration corrective finale : Solution définitive sans ambiguïté
-- Date: 2025-01-08

DROP FUNCTION IF EXISTS public.sync_missing_user_roles();

CREATE FUNCTION public.sync_missing_user_roles()
RETURNS TABLE(
  action_type text,
  affected_user_id uuid,
  assigned_role text,
  source_table text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Chauffeurs
  INSERT INTO public.user_roles (user_id, role, is_active)
  SELECT DISTINCT c.user_id, 'driver'::user_role, true
  FROM public.chauffeurs c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = c.user_id AND ur.role = 'driver'::user_role
  )
  ON CONFLICT (user_id, role) DO UPDATE SET is_active = EXCLUDED.is_active;

  RETURN QUERY
  SELECT 'INSERTED_DRIVER'::text, c.user_id, 'driver'::text, 'chauffeurs'::text
  FROM public.chauffeurs c
  INNER JOIN public.user_roles ur ON ur.user_id = c.user_id 
  WHERE ur.role = 'driver'::user_role;

  -- Partenaires
  INSERT INTO public.user_roles (user_id, role, is_active)
  SELECT DISTINCT p.user_id, 'partner'::user_role, true
  FROM public.partenaires p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.user_id AND ur.role = 'partner'::user_role
  )
  ON CONFLICT (user_id, role) DO UPDATE SET is_active = EXCLUDED.is_active;

  RETURN QUERY
  SELECT 'INSERTED_PARTNER'::text, p.user_id, 'partner'::text, 'partenaires'::text
  FROM public.partenaires p
  INNER JOIN public.user_roles ur ON ur.user_id = p.user_id 
  WHERE ur.role = 'partner'::user_role;

  -- Admins
  INSERT INTO public.user_roles (user_id, role, is_active, admin_role)
  SELECT DISTINCT a.user_id, 'admin'::user_role, true, COALESCE(a.admin_level, 'moderator')::admin_role
  FROM public.admins a
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = a.user_id AND ur.role = 'admin'::user_role
  )
  ON CONFLICT (user_id, role) DO UPDATE SET is_active = EXCLUDED.is_active;

  RETURN QUERY
  SELECT 'INSERTED_ADMIN'::text, a.user_id, 'admin'::text, 'admins'::text
  FROM public.admins a
  INNER JOIN public.user_roles ur ON ur.user_id = a.user_id 
  WHERE ur.role = 'admin'::user_role;

  -- Clients
  INSERT INTO public.user_roles (user_id, role, is_active)
  SELECT DISTINCT cl.user_id, 'client'::user_role, true
  FROM public.clients cl
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = cl.user_id AND ur.role = 'client'::user_role
  )
  ON CONFLICT (user_id, role) DO UPDATE SET is_active = EXCLUDED.is_active;

  RETURN QUERY
  SELECT 'INSERTED_CLIENT'::text, cl.user_id, 'client'::text, 'clients'::text
  FROM public.clients cl
  INNER JOIN public.user_roles ur ON ur.user_id = cl.user_id 
  WHERE ur.role = 'client'::user_role;
END;
$$;

-- Exécution immédiate
SELECT * FROM public.sync_missing_user_roles();