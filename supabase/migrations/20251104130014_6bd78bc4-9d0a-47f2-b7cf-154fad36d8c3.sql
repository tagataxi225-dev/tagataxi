-- ✅ Phase 1: Correction RLS Policies pour accès complet aux fonctionnalités

-- =======================
-- 1. MARKETPLACE PRODUCTS: Permettre aux vendeurs de voir TOUS leurs produits
-- =======================

-- Supprimer l'ancienne policy restrictive
DROP POLICY IF EXISTS "Users can view active products" ON marketplace_products;

-- Policy pour les produits publics (approved + active)
CREATE POLICY "Public can view approved active products" ON marketplace_products
  FOR SELECT
  USING (moderation_status = 'approved' AND status = 'active');

-- Policy pour les vendeurs (TOUS leurs produits, peu importe le statut)
CREATE POLICY "Sellers view ALL own products" ON marketplace_products
  FOR SELECT
  USING (auth.uid() = seller_id);

-- Policy pour les admins (tout voir)
CREATE POLICY "Admins view all products" ON marketplace_products
  FOR SELECT
  USING (is_admin_fast());

-- =======================
-- 2. CLIENTS: Simplifier l'accès aux propres données
-- =======================

-- Supprimer policy complexe qui peut causer des conflits
DROP POLICY IF EXISTS "admins_can_read_all_clients" ON clients;

-- Policy séparée pour users (propres données)
CREATE POLICY "Users read own client data" ON clients
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy séparée pour admins (toutes données)
CREATE POLICY "Admins read all clients" ON clients
  FOR SELECT
  USING (is_admin_fast());

-- =======================
-- 3. TRANSPORT BOOKINGS: Séparer policies user/admin
-- =======================

-- Supprimer policy complexe
DROP POLICY IF EXISTS "admins_can_read_all_bookings" ON transport_bookings;

-- Policy pour users (leurs réservations)
CREATE POLICY "Users read own bookings" ON transport_bookings
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = driver_id);

-- Policy pour admins (toutes réservations)
CREATE POLICY "Admins read all bookings" ON transport_bookings
  FOR SELECT
  USING (is_admin_fast());

-- =======================
-- 4. DELIVERY ORDERS: Accès utilisateur simplifié
-- =======================

DROP POLICY IF EXISTS "delivery_orders_own_data" ON delivery_orders;

CREATE POLICY "Users read own delivery orders" ON delivery_orders
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = driver_id);

CREATE POLICY "Admins read all delivery orders" ON delivery_orders
  FOR SELECT
  USING (is_admin_fast());

-- =======================
-- 5. MARKETPLACE ORDERS: Accès buyer + seller
-- =======================

DROP POLICY IF EXISTS "marketplace_orders_own_data" ON marketplace_orders;

CREATE POLICY "Users read own marketplace orders" ON marketplace_orders
  FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Admins read all marketplace orders" ON marketplace_orders
  FOR SELECT
  USING (is_admin_fast());

-- =======================
-- 6. WALLET TRANSACTIONS: Accès utilisateur
-- =======================

DROP POLICY IF EXISTS "wallet_transactions_own_data" ON wallet_transactions;

CREATE POLICY "Users read own wallet transactions" ON wallet_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all wallet transactions" ON wallet_transactions
  FOR SELECT
  USING (is_admin_fast());

-- =======================
-- 7. INDEXES POUR PERFORMANCE
-- =======================

-- Index pour vérification vendeur marketplace
CREATE INDEX IF NOT EXISTS idx_marketplace_products_seller 
  ON marketplace_products(seller_id, created_at DESC);

-- Index pour recherche rapide par statut de modération
CREATE INDEX IF NOT EXISTS idx_marketplace_products_moderation 
  ON marketplace_products(moderation_status, status) 
  WHERE seller_id IS NOT NULL;

-- Index pour transport bookings par utilisateur
CREATE INDEX IF NOT EXISTS idx_transport_bookings_user 
  ON transport_bookings(user_id, updated_at DESC);

-- Index pour delivery orders par utilisateur
CREATE INDEX IF NOT EXISTS idx_delivery_orders_user 
  ON delivery_orders(user_id, updated_at DESC);

-- Index pour marketplace orders (buyer + seller)
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer 
  ON marketplace_orders(buyer_id, updated_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller 
  ON marketplace_orders(seller_id, updated_at DESC);

-- Index pour wallet transactions
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user 
  ON wallet_transactions(user_id, created_at DESC);

-- =======================
-- 8. CHAUFFEURS: Accès simplifié
-- =======================

DROP POLICY IF EXISTS "admins_can_read_all_drivers" ON chauffeurs;

CREATE POLICY "Users read own driver profile" ON chauffeurs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all driver profiles" ON chauffeurs
  FOR SELECT
  USING (is_admin_fast());