-- ============================================
-- MIGRATION : Table de liaison marketplace → delivery
-- Permet de tracker les livraisons Kwenda pour les commandes marketplace
-- ============================================

-- Créer la table delivery_assignments si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  delivery_order_id UUID NOT NULL REFERENCES public.delivery_orders(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'assigned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte d'unicité : une commande marketplace = une livraison
  UNIQUE(marketplace_order_id, delivery_order_id)
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_marketplace 
  ON public.delivery_assignments(marketplace_order_id);
  
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_delivery 
  ON public.delivery_assignments(delivery_order_id);
  
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status 
  ON public.delivery_assignments(status);

-- Activer RLS
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;

-- Policy : Les acheteurs peuvent voir leurs assignations
CREATE POLICY "Buyers can view their delivery assignments"
  ON public.delivery_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders
      WHERE marketplace_orders.id = delivery_assignments.marketplace_order_id
        AND marketplace_orders.buyer_id = auth.uid()
    )
  );

-- Policy : Les vendeurs peuvent voir leurs assignations
CREATE POLICY "Sellers can view their delivery assignments"
  ON public.delivery_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders
      WHERE marketplace_orders.id = delivery_assignments.marketplace_order_id
        AND marketplace_orders.seller_id = auth.uid()
    )
  );

-- Policy : Les chauffeurs peuvent voir leurs assignations
CREATE POLICY "Drivers can view their delivery assignments"
  ON public.delivery_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.delivery_orders
      WHERE delivery_orders.id = delivery_assignments.delivery_order_id
        AND delivery_orders.driver_id = auth.uid()
    )
  );

-- Policy : Le système peut tout créer/modifier (via service role)
CREATE POLICY "Service role can manage all assignments"
  ON public.delivery_assignments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_delivery_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_delivery_assignments_updated_at ON public.delivery_assignments;

CREATE TRIGGER set_delivery_assignments_updated_at
  BEFORE UPDATE ON public.delivery_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_assignments_updated_at();

-- Commentaires pour documentation
COMMENT ON TABLE public.delivery_assignments IS 'Table de liaison entre commandes marketplace et livraisons Kwenda';
COMMENT ON COLUMN public.delivery_assignments.marketplace_order_id IS 'ID de la commande marketplace';
COMMENT ON COLUMN public.delivery_assignments.delivery_order_id IS 'ID de la livraison Kwenda associée';
COMMENT ON COLUMN public.delivery_assignments.status IS 'Statut de l''assignation (assigned, completed, cancelled)';
