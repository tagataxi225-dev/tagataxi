
-- Table partner_promotions
CREATE TABLE public.partner_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partenaires(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  promotion_type TEXT NOT NULL CHECK (promotion_type IN ('agency_boost', 'vehicle_boost')),
  target_id UUID,
  plan_key TEXT NOT NULL CHECK (plan_key IN ('3d', '7d', '14d', '30d')),
  amount_paid NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Colonnes is_featured sur partenaires
ALTER TABLE public.partenaires ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.partenaires ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- Colonnes is_featured sur rental_vehicles
ALTER TABLE public.rental_vehicles ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.rental_vehicles ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- RLS
ALTER TABLE public.partner_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own promotions"
ON public.partner_promotions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own promotions"
ON public.partner_promotions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX idx_partner_promotions_partner ON public.partner_promotions(partner_id);
CREATE INDEX idx_partner_promotions_active ON public.partner_promotions(is_active, expires_at);

-- Function to expire promotions
CREATE OR REPLACE FUNCTION public.expire_partner_promotions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Désactiver les promotions expirées
  UPDATE public.partner_promotions
  SET is_active = false
  WHERE is_active = true AND expires_at < now();

  -- Retirer is_featured des partenaires sans promo active
  UPDATE public.partenaires p
  SET is_featured = false, featured_until = NULL
  WHERE p.is_featured = true
    AND NOT EXISTS (
      SELECT 1 FROM public.partner_promotions pp
      WHERE pp.partner_id = p.id
        AND pp.promotion_type = 'agency_boost'
        AND pp.is_active = true
        AND pp.expires_at > now()
    );

  -- Retirer is_featured des véhicules sans promo active
  UPDATE public.rental_vehicles rv
  SET is_featured = false, featured_until = NULL
  WHERE rv.is_featured = true
    AND NOT EXISTS (
      SELECT 1 FROM public.partner_promotions pp
      WHERE pp.target_id = rv.id
        AND pp.promotion_type = 'vehicle_boost'
        AND pp.is_active = true
        AND pp.expires_at > now()
    );
END;
$$;
