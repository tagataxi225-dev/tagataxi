-- Politique RLS pour merchant_transactions
-- Permettre aux vendeurs de lire leurs propres transactions
CREATE POLICY "vendor_read_own_merchant_transactions" ON merchant_transactions
  FOR SELECT USING (vendor_id = auth.uid());

-- Permettre l'insertion via service role (déjà autorisé), mais aussi pour les vendeurs si nécessaire
CREATE POLICY "vendor_insert_own_merchant_transactions" ON merchant_transactions
  FOR INSERT WITH CHECK (vendor_id = auth.uid());

-- Politique pour merchant_accounts si pas déjà existante
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'merchant_accounts' 
    AND policyname = 'vendor_read_own_merchant_account'
  ) THEN
    CREATE POLICY "vendor_read_own_merchant_account" ON merchant_accounts
      FOR SELECT USING (vendor_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'merchant_accounts' 
    AND policyname = 'vendor_insert_own_merchant_account'
  ) THEN
    CREATE POLICY "vendor_insert_own_merchant_account" ON merchant_accounts
      FOR INSERT WITH CHECK (vendor_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'merchant_accounts' 
    AND policyname = 'vendor_update_own_merchant_account'
  ) THEN
    CREATE POLICY "vendor_update_own_merchant_account" ON merchant_accounts
      FOR UPDATE USING (vendor_id = auth.uid());
  END IF;
END $$;