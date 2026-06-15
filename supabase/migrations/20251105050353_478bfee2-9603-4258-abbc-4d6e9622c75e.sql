-- Fonction pour vérifier si un email existe déjà
CREATE OR REPLACE FUNCTION public.check_user_exists_by_email(
  p_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Rechercher dans auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;
  
  -- Retourner true si trouvé, false sinon
  RETURN v_user_id IS NOT NULL;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.check_user_exists_by_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_exists_by_email TO anon;

COMMENT ON FUNCTION public.check_user_exists_by_email IS 
  'Vérifie si un email existe déjà dans le système sans exposer de données sensibles';