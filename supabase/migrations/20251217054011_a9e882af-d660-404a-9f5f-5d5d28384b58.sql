-- Politiques RLS pour permettre aux vendeurs d'accéder à leur wallet

-- Politique de lecture pour vendor_wallets
DROP POLICY IF EXISTS "vendor_read_own_wallet" ON vendor_wallets;
CREATE POLICY "vendor_read_own_wallet" ON vendor_wallets
  FOR SELECT USING (vendor_id = auth.uid());

-- Politique d'insertion pour vendor_wallets (création initiale)
DROP POLICY IF EXISTS "vendor_insert_own_wallet" ON vendor_wallets;
CREATE POLICY "vendor_insert_own_wallet" ON vendor_wallets
  FOR INSERT WITH CHECK (vendor_id = auth.uid());

-- Politique de mise à jour pour vendor_wallets
DROP POLICY IF EXISTS "vendor_update_own_wallet" ON vendor_wallets;
CREATE POLICY "vendor_update_own_wallet" ON vendor_wallets
  FOR UPDATE USING (vendor_id = auth.uid());

-- Politiques pour vendor_wallet_transactions
DROP POLICY IF EXISTS "vendor_read_own_transactions" ON vendor_wallet_transactions;
CREATE POLICY "vendor_read_own_transactions" ON vendor_wallet_transactions
  FOR SELECT USING (vendor_id = auth.uid());

-- Politique d'insertion pour les transactions (le vendeur peut enregistrer ses transactions)
DROP POLICY IF EXISTS "vendor_insert_own_transactions" ON vendor_wallet_transactions;
CREATE POLICY "vendor_insert_own_transactions" ON vendor_wallet_transactions
  FOR INSERT WITH CHECK (vendor_id = auth.uid());