-- ==========================================
-- Migration validation vendeur livraison marketplace
-- ==========================================

-- Ajouter les colonnes nécessaires à marketplace_orders
ALTER TABLE public.marketplace_orders
ADD COLUMN IF NOT EXISTS delivery_fee numeric,
ADD COLUMN IF NOT EXISTS vendor_approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivery_fee_approved_by_buyer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS vendor_delivery_method text; -- 'kwenda' ou 'self'

-- Ajouter colonnes à marketplace_delivery_assignments
ALTER TABLE public.marketplace_delivery_assignments
ADD COLUMN IF NOT EXISTS assigned_by_vendor boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS vendor_delivery_notes text;

-- Mettre à jour le commentaire sur status
COMMENT ON COLUMN public.marketplace_orders.status IS 'Statuts: pending (attente vendeur), pending_buyer_approval (attente client), confirmed, preparing, ready_for_pickup, in_transit, delivered, completed, cancelled';

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_vendor_validation 
ON public.marketplace_orders(seller_id, status, vendor_approved_at) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer_approval 
ON public.marketplace_orders(buyer_id, status, delivery_fee_approved_by_buyer) 
WHERE status = 'pending_buyer_approval';