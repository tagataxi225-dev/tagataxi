-- ==========================================
-- PHASE 1 : Table escrow livraison séparée
-- ==========================================

CREATE TABLE IF NOT EXISTS public.delivery_escrow_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  driver_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('wallet', 'cash_on_delivery')),
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded', 'pending_cash')),
  released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_delivery_escrow_order ON public.delivery_escrow_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_escrow_driver ON public.delivery_escrow_payments(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_escrow_status ON public.delivery_escrow_payments(status);

-- RLS policies
ALTER TABLE public.delivery_escrow_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their delivery escrow"
  ON public.delivery_escrow_payments FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "Drivers can view their delivery escrow"
  ON public.delivery_escrow_payments FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Service role can manage delivery escrow"
  ON public.delivery_escrow_payments FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- PHASE 9 : Table gestion cash livreurs
-- ==========================================

CREATE TABLE IF NOT EXISTS public.driver_cash_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL,
  delivery_order_id UUID NOT NULL,
  marketplace_order_id UUID REFERENCES public.marketplace_orders(id),
  amount DECIMAL(10,2) NOT NULL,
  collection_type TEXT NOT NULL CHECK (collection_type IN ('delivery_fee', 'product_payment')),
  status TEXT NOT NULL DEFAULT 'collected' CHECK (status IN ('collected', 'reconciled', 'deposited')),
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reconciled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_driver ON public.driver_cash_collections(driver_id);
CREATE INDEX IF NOT EXISTS idx_cash_status ON public.driver_cash_collections(status);

ALTER TABLE public.driver_cash_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view their cash collections"
  ON public.driver_cash_collections FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can update their cash collections"
  ON public.driver_cash_collections FOR UPDATE
  USING (driver_id = auth.uid());

CREATE POLICY "Service role can manage cash collections"
  ON public.driver_cash_collections FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- PHASE 8 : Auto-release escrow après 48h
-- ==========================================

-- Fonction pour auto-release
CREATE OR REPLACE FUNCTION public.auto_release_escrow_after_48h()
RETURNS void AS $$
BEGIN
  -- Libérer les escrows produits > 48h après livraison
  UPDATE public.escrow_payments
  SET 
    status = 'released',
    released_at = now(),
    updated_at = now()
  WHERE 
    status = 'held'
    AND order_id IN (
      SELECT id FROM public.marketplace_orders
      WHERE status = 'delivered'
      AND delivered_at < now() - INTERVAL '48 hours'
    );

  -- Libérer les escrows livraison > 48h après livraison
  UPDATE public.delivery_escrow_payments
  SET 
    status = 'released',
    released_at = now(),
    updated_at = now()
  WHERE 
    status = 'held'
    AND order_id IN (
      SELECT id FROM public.marketplace_orders
      WHERE status = 'delivered'
      AND delivered_at < now() - INTERVAL '48 hours'
    );

  -- Transférer les fonds aux vendeurs
  INSERT INTO public.vendor_wallet_transactions (
    vendor_id,
    amount,
    transaction_type,
    description,
    reference_type,
    reference_id,
    status
  )
  SELECT 
    mo.seller_id,
    ep.amount * 0.95, -- 5% commission
    'escrow_release',
    'Auto-release après 48h - Commande ' || mo.id,
    'marketplace_order',
    mo.id,
    'completed'
  FROM public.escrow_payments ep
  JOIN public.marketplace_orders mo ON ep.order_id = mo.id
  WHERE ep.status = 'released' 
    AND ep.released_at > now() - INTERVAL '1 minute'
    AND NOT EXISTS (
      SELECT 1 FROM public.vendor_wallet_transactions
      WHERE reference_id = mo.id AND transaction_type = 'escrow_release'
    );

  -- Mettre à jour les wallets vendeurs
  UPDATE public.vendor_wallets vw
  SET 
    available_balance = vw.available_balance + subq.total_amount,
    total_earnings = vw.total_earnings + subq.total_amount,
    updated_at = now()
  FROM (
    SELECT 
      mo.seller_id,
      SUM(ep.amount * 0.95) as total_amount
    FROM public.escrow_payments ep
    JOIN public.marketplace_orders mo ON ep.order_id = mo.id
    WHERE ep.status = 'released' 
      AND ep.released_at > now() - INTERVAL '1 minute'
    GROUP BY mo.seller_id
  ) subq
  WHERE vw.vendor_id = subq.seller_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajouter colonnes manquantes à marketplace_orders si nécessaire
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_orders' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE public.marketplace_orders ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_orders' AND column_name = 'delivery_fee_payment_method'
  ) THEN
    ALTER TABLE public.marketplace_orders ADD COLUMN delivery_fee_payment_method TEXT CHECK (delivery_fee_payment_method IN ('wallet', 'cash_on_delivery'));
  END IF;
END $$;