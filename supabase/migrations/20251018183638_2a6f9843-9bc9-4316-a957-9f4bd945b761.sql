-- ✅ PHASE 1 : Supprimer TOUS les anciens triggers sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_client ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_restaurant ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_driver ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- ✅ PHASE 2 : Améliorer la fonction get_current_user_role avec priorité intelligente
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Retourner le rôle selon l'ordre de priorité :
  -- admin > restaurant > partner > driver > client
  SELECT role::text INTO v_role
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
    AND is_active = true
  ORDER BY 
    CASE role::text
      WHEN 'admin' THEN 1
      WHEN 'restaurant' THEN 2
      WHEN 'partner' THEN 3
      WHEN 'driver' THEN 4
      WHEN 'client' THEN 5
      ELSE 6
    END
  LIMIT 1;
  
  RETURN v_role;
END;
$$;

-- ✅ PHASE 3 : Nettoyer les doublons existants (profil client créé par erreur pour gextelci@gmail.com)
-- Supprimer le profil client créé par erreur
DELETE FROM public.clients 
WHERE user_id = '06e5e372-5bc7-4329-834a-f91ecce15519';

-- Supprimer le rôle client créé par erreur
DELETE FROM public.user_roles 
WHERE user_id = '06e5e372-5bc7-4329-834a-f91ecce15519' 
  AND role = 'client';