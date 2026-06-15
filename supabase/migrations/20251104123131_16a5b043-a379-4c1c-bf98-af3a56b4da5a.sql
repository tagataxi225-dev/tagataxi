-- ✅ PHASE 2: CORRECTION RLS POLICIES ADMIN
-- Migration pour optimiser l'accès admin et corriger les policies trop restrictives

-- ========================================
-- 1. FONCTION RLS ADMIN OPTIMISÉE
-- ========================================

-- Fonction optimisée pour vérifier admin (STABLE = cache pendant transaction)
CREATE OR REPLACE FUNCTION is_admin_fast()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ========================================
-- 2. CORRECTION POLICIES CLIENTS
-- ========================================

-- Supprimer l'ancienne policy restrictive
DROP POLICY IF EXISTS "admins_view_single_client_restricted" ON clients;

-- Créer policy simplifiée pour admins
CREATE POLICY "admins_can_read_all_clients" ON clients
  FOR SELECT
  USING (auth.uid() = user_id OR is_admin_fast());

-- ========================================
-- 3. CORRECTION POLICIES CHAUFFEURS
-- ========================================

-- Supprimer l'ancienne policy restrictive
DROP POLICY IF EXISTS "chauffeurs_admin_view_secure" ON chauffeurs;

-- Créer policy simplifiée pour admins
CREATE POLICY "admins_can_read_all_drivers" ON chauffeurs
  FOR SELECT
  USING (auth.uid() = user_id OR is_admin_fast());

-- ========================================
-- 4. CORRECTION POLICIES TRANSPORT_BOOKINGS
-- ========================================

-- Supprimer l'ancienne policy restrictive si elle existe
DROP POLICY IF EXISTS "transport_bookings_own_data" ON transport_bookings;

-- Créer policy simplifiée pour admins
CREATE POLICY "admins_can_read_all_bookings" ON transport_bookings
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR auth.uid() = driver_id 
    OR is_admin_fast()
  );

-- ========================================
-- 5. INDEX POUR PERFORMANCE
-- ========================================

-- Index pour accélérer vérifications RLS admin
CREATE INDEX IF NOT EXISTS idx_user_roles_admin_check 
  ON user_roles(user_id, role, is_active) 
  WHERE role = 'admin' AND is_active = true;

-- Index pour stats transport
CREATE INDEX IF NOT EXISTS idx_transport_bookings_admin_stats 
  ON transport_bookings(status, actual_price, created_at);

-- Index pour stats marketplace
CREATE INDEX IF NOT EXISTS idx_marketplace_products_moderation 
  ON marketplace_products(moderation_status, created_at);

-- Index pour chauffeurs actifs
CREATE INDEX IF NOT EXISTS idx_chauffeurs_active_status
  ON chauffeurs(is_active, updated_at)
  WHERE is_active = true;

-- ========================================
-- 6. COMMENTAIRES EXPLICATIFS
-- ========================================

COMMENT ON FUNCTION is_admin_fast() IS 
  'Fonction STABLE optimisée pour vérifier le rôle admin. 
   Résultat mis en cache pendant la transaction pour éviter les requêtes répétées.
   Utilisée par les RLS policies pour donner accès complet aux admins.';

COMMENT ON POLICY "admins_can_read_all_clients" ON clients IS
  'Permet aux admins de voir tous les clients. 
   Les utilisateurs normaux ne voient que leur propre profil.';

COMMENT ON POLICY "admins_can_read_all_drivers" ON chauffeurs IS
  'Permet aux admins de voir tous les chauffeurs.
   Les chauffeurs ne voient que leur propre profil.';

COMMENT ON POLICY "admins_can_read_all_bookings" ON transport_bookings IS
  'Permet aux admins de voir toutes les réservations.
   Les utilisateurs voient leurs propres réservations (en tant que client ou chauffeur).';