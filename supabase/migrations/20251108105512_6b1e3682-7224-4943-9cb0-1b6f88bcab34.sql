-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔧 SÉPARATION PAIEMENT COMMANDE/LIVRAISON
-- Ajouter colonnes pour gérer le paiement de livraison séparément
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1️⃣ KWENDA FOOD : Ajouter colonnes delivery_payment
ALTER TABLE food_orders 
ADD COLUMN IF NOT EXISTS delivery_payment_status TEXT DEFAULT 'pending' 
CHECK (delivery_payment_status IN ('pending', 'paid', 'cash_on_delivery', 'not_required'));

ALTER TABLE food_orders 
ADD COLUMN IF NOT EXISTS delivery_payment_method TEXT 
CHECK (delivery_payment_method IN ('kwenda_pay', 'cash', 'mobile_money', NULL));

ALTER TABLE food_orders 
ADD COLUMN IF NOT EXISTS delivery_paid_at TIMESTAMPTZ;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_food_orders_delivery_payment_status 
ON food_orders(delivery_payment_status);

-- 2️⃣ KWENDA SHOP : Ajouter colonnes delivery_payment
ALTER TABLE marketplace_orders 
ADD COLUMN IF NOT EXISTS delivery_payment_status TEXT DEFAULT 'pending' 
CHECK (delivery_payment_status IN ('pending', 'paid', 'cash_on_delivery', 'not_required'));

ALTER TABLE marketplace_orders 
ADD COLUMN IF NOT EXISTS delivery_paid_at TIMESTAMPTZ;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_delivery_payment_status 
ON marketplace_orders(delivery_payment_status);

-- 3️⃣ Nouveau type de transaction wallet pour paiement livraison séparé
COMMENT ON COLUMN wallet_transactions.transaction_type IS 
'Types: deposit, withdrawal, ride_payment, delivery_payment, food_order, marketplace_purchase, delivery_payment_separate, bonus_payment, refund, commission';

-- 4️⃣ Nouveau type d'activité pour logs
COMMENT ON COLUMN activity_logs.activity_type IS 
'Types: wallet_topup, ride_payment, delivery_payment, food_order, marketplace_purchase, delivery_payment_separate, bonus_payment, refund, commission';

-- ✅ Migration terminée
DO $$
BEGIN
  RAISE NOTICE '✅ Colonnes delivery_payment ajoutées avec succès';
  RAISE NOTICE '📊 Tables modifiées: food_orders, marketplace_orders';
  RAISE NOTICE '🔄 Prochaine étape: Modifier food-order-processor pour retirer delivery_fee du total';
END $$;