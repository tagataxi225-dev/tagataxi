-- ========================================
-- PHASE 1: Ajout colonnes manquantes marketplace_products
-- ========================================

-- Ajouter colonnes pour tracking modération admin
ALTER TABLE public.marketplace_products 
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS moderator_id UUID REFERENCES auth.users(id);

-- Créer index pour performance
CREATE INDEX IF NOT EXISTS idx_marketplace_products_moderator 
  ON public.marketplace_products(moderator_id) 
  WHERE moderator_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_marketplace_products_moderation_pending
  ON public.marketplace_products(moderation_status, created_at)
  WHERE moderation_status = 'pending';

-- ========================================
-- VÉRIFIER & CORRIGER RLS POLICIES
-- ========================================

-- Supprimer anciennes policies si elles existent
DROP POLICY IF EXISTS "Sellers manage their products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Public view approved products" ON public.marketplace_products;

-- 1. Vendeurs peuvent voir LEURS PROPRES produits (tous statuts)
CREATE POLICY "Sellers view own products"
  ON public.marketplace_products
  FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- 2. Vendeurs peuvent créer leurs produits (auto pending)
CREATE POLICY "Sellers create products"
  ON public.marketplace_products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = seller_id
    AND moderation_status = 'pending'
  );

-- 3. Vendeurs peuvent modifier LEURS produits
CREATE POLICY "Sellers update own products"
  ON public.marketplace_products
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- 4. Public voit uniquement produits approuvés + actifs
CREATE POLICY "Public view approved products"
  ON public.marketplace_products
  FOR SELECT
  TO authenticated
  USING (
    moderation_status = 'approved'
    AND status = 'active'
  );

-- 5. Admins peuvent TOUT voir et modifier
CREATE POLICY "Admins full access products"
  ON public.marketplace_products
  FOR ALL
  TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- ========================================
-- OPTIMISER admin_notifications RLS
-- ========================================

-- Vérifier que seuls les admins ont accès
DROP POLICY IF EXISTS "admin_notifications_admin_access" ON public.admin_notifications;

CREATE POLICY "Admins manage notifications"
  ON public.admin_notifications
  FOR ALL
  TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());