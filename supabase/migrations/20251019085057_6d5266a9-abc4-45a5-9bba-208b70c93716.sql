-- Ajouter 'vendor' à l'enum user_role s'il n'existe pas déjà
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'vendor' AND enumtypid = 'user_role'::regtype) THEN
    ALTER TYPE user_role ADD VALUE 'vendor';
  END IF;
END $$;

-- ========================================
-- RESTRUCTURATION MARKETPLACE : SÉCURISATION RLS
-- ========================================

-- 1. VENDOR_PROFILES : RLS Stricte
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendor_profiles_own_data" ON vendor_profiles;
DROP POLICY IF EXISTS "vendor_profiles_admin_access" ON vendor_profiles;

CREATE POLICY "vendor_profiles_own_data"
ON vendor_profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vendor_profiles_admin_access"
ON vendor_profiles
FOR SELECT
USING (is_current_user_admin());

-- 2. MARKETPLACE_PRODUCTS : RLS Vendeurs
DROP POLICY IF EXISTS "marketplace_products_vendor_insert" ON marketplace_products;
DROP POLICY IF EXISTS "marketplace_products_vendor_update" ON marketplace_products;
DROP POLICY IF EXISTS "marketplace_products_vendor_select" ON marketplace_products;

CREATE POLICY "marketplace_products_vendor_insert"
ON marketplace_products
FOR INSERT
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "marketplace_products_vendor_update"
ON marketplace_products
FOR UPDATE
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "marketplace_products_vendor_select"
ON marketplace_products
FOR SELECT
USING (auth.uid() = seller_id OR is_current_user_admin());

-- 3. MARKETPLACE_ORDERS : RLS Vendeurs
DROP POLICY IF EXISTS "marketplace_orders_vendor_select" ON marketplace_orders;
DROP POLICY IF EXISTS "marketplace_orders_vendor_update" ON marketplace_orders;

CREATE POLICY "marketplace_orders_vendor_select"
ON marketplace_orders
FOR SELECT
USING (
  auth.uid() = seller_id
  OR auth.uid() = buyer_id
  OR is_current_user_admin()
);

CREATE POLICY "marketplace_orders_vendor_update"
ON marketplace_orders
FOR UPDATE
USING (auth.uid() = seller_id OR is_current_user_admin())
WITH CHECK (auth.uid() = seller_id OR is_current_user_admin());

-- 4. ESCROW_TRANSACTIONS : RLS Vendeurs
DROP POLICY IF EXISTS "escrow_transactions_vendor_access" ON escrow_transactions;

CREATE POLICY "escrow_transactions_vendor_access"
ON escrow_transactions
FOR SELECT
USING (
  auth.uid() = seller_id
  OR auth.uid() = buyer_id
  OR is_current_user_admin()
);

-- 5. MERCHANT_ACCOUNTS : RLS Vendeurs
ALTER TABLE merchant_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "merchant_accounts_own_data" ON merchant_accounts;

CREATE POLICY "merchant_accounts_own_data"
ON merchant_accounts
FOR ALL
USING (auth.uid() = vendor_id OR is_current_user_admin())
WITH CHECK (auth.uid() = vendor_id OR is_current_user_admin());