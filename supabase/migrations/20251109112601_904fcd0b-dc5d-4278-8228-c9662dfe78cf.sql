-- Fonction RPC pour récupérer l'email d'un utilisateur depuis son ID
-- Utilisée quand on trouve un partner par téléphone et qu'on a besoin de son email

CREATE OR REPLACE FUNCTION get_user_by_email_from_id(p_user_id UUID)
RETURNS TABLE(email TEXT) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.email::TEXT
  FROM auth.users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql;