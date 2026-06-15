-- ============================================
-- 🔐 CORRECTIONS RLS POLICIES CRITIQUES (Simplifié)
-- ============================================

-- 1️⃣ Ajouter policy pour service_role sur food_orders
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'food_orders' 
    AND policyname = 'service_role_insert_food_orders'
  ) THEN
    CREATE POLICY "service_role_insert_food_orders"
    ON food_orders FOR INSERT
    TO service_role
    WITH CHECK (true);
  END IF;
END $$;

-- 2️⃣ Ajouter policy pour service_role sur marketplace_orders
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'marketplace_orders' 
    AND policyname = 'service_role_insert_marketplace_orders'
  ) THEN
    CREATE POLICY "service_role_insert_marketplace_orders"
    ON marketplace_orders FOR INSERT
    TO service_role
    WITH CHECK (true);
  END IF;
END $$;

-- 3️⃣ Ajouter policy pour service_role sur escrow_transactions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'escrow_transactions' 
    AND policyname = 'service_role_manage_escrow'
  ) THEN
    CREATE POLICY "service_role_manage_escrow"
    ON escrow_transactions FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- 4️⃣ Policy vendeurs pour insertion produits (simplifié)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'marketplace_products' 
    AND policyname = 'vendors_insert_products'
  ) THEN
    CREATE POLICY "vendors_insert_products"
    ON marketplace_products FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() = seller_id
      AND EXISTS (
        SELECT 1 FROM vendor_profiles 
        WHERE user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 5️⃣ Policy vendeurs pour update de leurs propres produits
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'marketplace_products' 
    AND policyname = 'vendors_update_own_products'
  ) THEN
    CREATE POLICY "vendors_update_own_products"
    ON marketplace_products FOR UPDATE
    TO authenticated
    USING (auth.uid() = seller_id)
    WITH CHECK (auth.uid() = seller_id);
  END IF;
END $$;

-- 6️⃣ Policy vendeurs pour select de leurs commandes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'marketplace_orders' 
    AND policyname = 'vendors_select_orders'
  ) THEN
    CREATE POLICY "vendors_select_orders"
    ON marketplace_orders FOR SELECT
    TO authenticated
    USING (auth.uid() = seller_id);
  END IF;
END $$;