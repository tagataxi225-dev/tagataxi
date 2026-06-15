-- ============================================
-- CORRECTION COMPLÈTE : Profiles et Rôles
-- ============================================
-- Objectif : Résoudre problèmes d'accès aux profils et authentification
-- 1. Policies profiles simplifiées
-- 2. Fonction get_user_roles optimisée avec SECURITY DEFINER
-- 3. Indexes de performance

-- ==========================================
-- 1. CORRIGER POLICIES PROFILES
-- ==========================================

-- Supprimer anciennes policies potentiellement conflictuelles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_own_data" ON profiles;

-- Policy lecture : Utilisateurs voient leur propre profil
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy lecture : Admins voient tous les profils
CREATE POLICY "Admins read all profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
      AND ur.is_active = true
    )
  );

-- Policy update : Utilisateurs modifient leur propre profil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy insert : Utilisateurs créent leur propre profil
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 2. OPTIMISER FONCTION get_user_roles
-- ==========================================

-- Recréer avec SECURITY DEFINER pour bypass RLS
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id UUID)
RETURNS TABLE (
  role TEXT,
  admin_role TEXT,
  permissions TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Retourner tous les rôles actifs de l'utilisateur
  RETURN QUERY
  SELECT 
    ur.role::TEXT,
    ur.admin_role::TEXT,
    COALESCE(ARRAY['transport_read', 'marketplace_read']::TEXT[], ARRAY[]::TEXT[]) as permissions
  FROM user_roles ur
  WHERE ur.user_id = p_user_id
  AND ur.is_active = true
  ORDER BY 
    CASE ur.role
      WHEN 'admin' THEN 1
      WHEN 'partner' THEN 2
      WHEN 'driver' THEN 3
      WHEN 'client' THEN 4
      ELSE 5
    END;
  
  -- Si aucun rôle trouvé, retourner client par défaut
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      'client'::TEXT as role,
      NULL::TEXT as admin_role,
      ARRAY['transport_read', 'marketplace_read']::TEXT[] as permissions;
  END IF;
END;
$$;

-- ==========================================
-- 3. AJOUTER POLICIES USER_ROLES
-- ==========================================

-- Policy lecture : Utilisateurs voient leurs propres rôles
DROP POLICY IF EXISTS "Users can read own roles" ON user_roles;
CREATE POLICY "Users can read own roles" ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy lecture : Admins voient tous les rôles
DROP POLICY IF EXISTS "Admins read all roles" ON user_roles;
CREATE POLICY "Admins read all roles" ON user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
      AND ur.is_active = true
    )
  );

-- ==========================================
-- 4. INDEXES DE PERFORMANCE
-- ==========================================

-- Index sur profiles pour lookup rapide
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
  ON profiles(user_id);

-- Index sur user_roles pour get_user_roles()
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup 
  ON user_roles(user_id, is_active, role);

-- Index sur user_roles pour vérifications admin
CREATE INDEX IF NOT EXISTS idx_user_roles_admin_check
  ON user_roles(user_id, role) 
  WHERE is_active = true AND role = 'admin';

-- ==========================================
-- 5. VÉRIFICATIONS ET COMMENTAIRES
-- ==========================================

COMMENT ON POLICY "Users can read own profile" ON profiles IS 
  'Permet aux utilisateurs de lire leur propre profil uniquement';

COMMENT ON POLICY "Admins read all profiles" ON profiles IS 
  'Permet aux admins de lire tous les profils pour gestion/support';

COMMENT ON FUNCTION get_user_roles(UUID) IS 
  'Retourne les rôles actifs d''un utilisateur avec SECURITY DEFINER pour éviter erreurs RLS';