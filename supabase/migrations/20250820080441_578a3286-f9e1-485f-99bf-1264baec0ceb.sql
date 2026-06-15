-- ÉTAPE 1: Corrections critiques base de données
-- Créer les tables manquantes pour les assignations livreurs et notations

-- Table pour les assignations de livraison marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_delivery_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  assignment_status TEXT NOT NULL DEFAULT 'assigned',
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  pickup_location TEXT NOT NULL,
  delivery_location TEXT NOT NULL,
  pickup_coordinates JSONB,
  delivery_coordinates JSONB,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les notations des chauffeurs/livreurs
CREATE TABLE IF NOT EXISTS public.driver_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  rater_id UUID NOT NULL,
  order_id UUID NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'transport', -- transport, delivery, marketplace
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  criteria JSONB DEFAULT '{}', -- {"punctuality": 5, "service": 4, etc.}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(driver_id, order_id, rater_id)
);

-- Table pour les vérifications vendeurs
CREATE TABLE IF NOT EXISTS public.seller_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  verification_type TEXT NOT NULL DEFAULT 'identity', -- identity, business, premium
  status TEXT NOT NULL DEFAULT 'pending', -- pending, verified, rejected
  verification_data JSONB DEFAULT '{}',
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  documents JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(seller_id, verification_type)
);

-- Table pour les notations vendeurs
CREATE TABLE IF NOT EXISTS public.seller_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  order_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  criteria JSONB DEFAULT '{}', -- {"quality": 5, "communication": 4, "delivery": 3}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(seller_id, order_id, buyer_id)
);

-- Table pour distribution automatique des commissions
CREATE TABLE IF NOT EXISTS public.commission_distributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  order_type TEXT NOT NULL, -- marketplace, delivery, transport
  seller_id UUID,
  driver_id UUID,
  platform_commission NUMERIC NOT NULL DEFAULT 0,
  driver_commission NUMERIC NOT NULL DEFAULT 0,
  seller_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Améliorer delivery_escrow pour inclure vendor_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'delivery_escrow' 
    AND column_name = 'vendor_id'
  ) THEN
    ALTER TABLE public.delivery_escrow ADD COLUMN vendor_id UUID;
  END IF;
END $$;

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_marketplace_delivery_assignments_order_id ON public.marketplace_delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_delivery_assignments_driver_id ON public.marketplace_delivery_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_ratings_driver_id ON public.driver_ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_seller_verifications_seller_id ON public.seller_verifications(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_ratings_seller_id ON public.seller_ratings(seller_id);

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE public.marketplace_delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_distributions ENABLE ROW LEVEL SECURITY;

-- Policies RLS pour marketplace_delivery_assignments
CREATE POLICY "Drivers can view their assignments" ON public.marketplace_delivery_assignments
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "System can manage delivery assignments" ON public.marketplace_delivery_assignments
  FOR ALL USING (true);

-- Policies RLS pour driver_ratings
CREATE POLICY "Users can create driver ratings" ON public.driver_ratings
  FOR INSERT WITH CHECK (auth.uid() = rater_id);

CREATE POLICY "Users can view relevant driver ratings" ON public.driver_ratings
  FOR SELECT USING (auth.uid() = driver_id OR auth.uid() = rater_id);

-- Policies RLS pour seller_verifications
CREATE POLICY "Sellers can view their verifications" ON public.seller_verifications
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "System can manage verifications" ON public.seller_verifications
  FOR ALL USING (true);

-- Policies RLS pour seller_ratings
CREATE POLICY "Users can create seller ratings" ON public.seller_ratings
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can view relevant seller ratings" ON public.seller_ratings
  FOR SELECT USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- Policies RLS pour commission_distributions
CREATE POLICY "Users can view their commissions" ON public.commission_distributions
  FOR SELECT USING (auth.uid() = seller_id OR auth.uid() = driver_id);

CREATE POLICY "System can manage commission distributions" ON public.commission_distributions
  FOR ALL USING (true);

-- Trigger pour auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer les triggers
CREATE TRIGGER update_marketplace_delivery_assignments_updated_at
  BEFORE UPDATE ON public.marketplace_delivery_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_ratings_updated_at
  BEFORE UPDATE ON public.driver_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seller_verifications_updated_at
  BEFORE UPDATE ON public.seller_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seller_ratings_updated_at
  BEFORE UPDATE ON public.seller_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_distributions_updated_at
  BEFORE UPDATE ON public.commission_distributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();