-- ========================================
-- PARTIE 1: Table partner_prizes
-- ========================================
CREATE TABLE IF NOT EXISTS public.partner_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name TEXT NOT NULL,
  partner_logo_url TEXT,
  
  -- Détails du prix
  name TEXT NOT NULL,
  description TEXT,
  prize_type TEXT NOT NULL DEFAULT 'physical_gift' CHECK (prize_type IN (
    'physical_gift',
    'voucher',
    'experience',
    'subscription'
  )),
  
  -- Valeur et stock
  estimated_value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'CDF',
  stock_quantity INTEGER DEFAULT 0,
  stock_unlimited BOOLEAN DEFAULT false,
  
  -- Distribution
  rarity_tier TEXT DEFAULT 'epic' CHECK (rarity_tier IN ('rare', 'epic', 'legendary')),
  distribution_probability NUMERIC DEFAULT 0.01,
  is_active BOOLEAN DEFAULT true,
  
  -- Logistique
  requires_delivery BOOLEAN DEFAULT true,
  delivery_instructions TEXT,
  claim_instructions TEXT,
  
  -- Images
  image_url TEXT,
  gallery_urls JSONB DEFAULT '[]'::jsonb,
  
  -- Validité
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_partner_prizes_active ON public.partner_prizes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_partner_prizes_rarity ON public.partner_prizes(rarity_tier);

-- ========================================
-- PARTIE 2: Extension table lottery_wins
-- ========================================
ALTER TABLE public.lottery_wins 
  ADD COLUMN IF NOT EXISTS partner_prize_id UUID REFERENCES public.partner_prizes(id),
  ADD COLUMN IF NOT EXISTS is_partner_prize BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_in_hours INTEGER DEFAULT 24,
  ADD COLUMN IF NOT EXISTS claim_status TEXT DEFAULT 'pending' CHECK (claim_status IN ('pending', 'claimed', 'expired', 'delivered'));

-- ========================================
-- PARTIE 3: Table partner_prize_claims (suivi livraisons)
-- ========================================
CREATE TABLE IF NOT EXISTS public.partner_prize_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_win_id UUID NOT NULL REFERENCES public.lottery_wins(id),
  partner_prize_id UUID NOT NULL REFERENCES public.partner_prizes(id),
  user_id UUID NOT NULL,
  
  -- Statut
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  
  -- Informations de livraison
  delivery_address TEXT,
  delivery_phone TEXT,
  delivery_notes TEXT,
  tracking_number TEXT,
  
  -- Dates
  claimed_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Admin
  processed_by UUID,
  admin_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_partner_prize_claims_status ON public.partner_prize_claims(status);
CREATE INDEX IF NOT EXISTS idx_partner_prize_claims_user ON public.partner_prize_claims(user_id);

-- ========================================
-- PARTIE 4: RLS Policies
-- ========================================

-- Enable RLS
ALTER TABLE public.partner_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_prize_claims ENABLE ROW LEVEL SECURITY;

-- partner_prizes: Tout le monde peut lire les prix actifs
CREATE POLICY "Anyone can view active partner prizes"
ON public.partner_prizes FOR SELECT
USING (is_active = true);

-- partner_prizes: Admin peut tout faire
CREATE POLICY "Admin can manage partner prizes"
ON public.partner_prizes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- partner_prize_claims: Utilisateur peut voir ses propres réclamations
CREATE POLICY "Users can view own claims"
ON public.partner_prize_claims FOR SELECT
USING (user_id = auth.uid());

-- partner_prize_claims: Utilisateur peut créer ses propres réclamations
CREATE POLICY "Users can create own claims"
ON public.partner_prize_claims FOR INSERT
WITH CHECK (user_id = auth.uid());

-- partner_prize_claims: Admin peut tout gérer
CREATE POLICY "Admin can manage claims"
ON public.partner_prize_claims FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- ========================================
-- PARTIE 5: Trigger updated_at
-- ========================================
CREATE OR REPLACE FUNCTION public.update_partner_prizes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_partner_prizes_updated_at ON public.partner_prizes;
CREATE TRIGGER update_partner_prizes_updated_at
  BEFORE UPDATE ON public.partner_prizes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_partner_prizes_updated_at();

DROP TRIGGER IF EXISTS update_partner_prize_claims_updated_at ON public.partner_prize_claims;
CREATE TRIGGER update_partner_prize_claims_updated_at
  BEFORE UPDATE ON public.partner_prize_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.update_partner_prizes_updated_at();