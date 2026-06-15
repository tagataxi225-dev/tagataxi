-- Supprimer l'ancienne version si elle existe
DROP FUNCTION IF EXISTS get_current_user_role();

-- Recréer la fonction correcte
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
BEGIN
  -- Récupérer l'ID de l'utilisateur connecté
  v_user_id := auth.uid();
  
  -- Si pas connecté, retourner null
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Récupérer le rôle le plus prioritaire (admin > partner > driver > client)
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role = 'admin' AND is_active = true) THEN 'admin'
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role = 'partner' AND is_active = true) THEN 'partner'
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role = 'driver' AND is_active = true) THEN 'driver'
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role = 'restaurant' AND is_active = true) THEN 'restaurant'
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role = 'vendor' AND is_active = true) THEN 'vendor'
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role = 'client' AND is_active = true) THEN 'client'
      ELSE 'client' -- Par défaut
    END INTO v_role;
  
  RETURN v_role;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_role() TO service_role;