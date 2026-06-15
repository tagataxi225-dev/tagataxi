-- =====================================================
-- Table ride_commissions : Suivi détaillé des commissions par course
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ride_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL,
  ride_type TEXT NOT NULL CHECK (ride_type IN ('transport', 'delivery')),
  driver_id UUID NOT NULL,
  partner_id UUID,
  ride_amount NUMERIC NOT NULL DEFAULT 0,
  kwenda_commission NUMERIC NOT NULL DEFAULT 0,
  kwenda_rate NUMERIC NOT NULL DEFAULT 12.0,
  partner_commission NUMERIC DEFAULT 0,
  partner_rate NUMERIC DEFAULT 0,
  driver_net_amount NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_ride_commissions_driver_id ON public.ride_commissions(driver_id);
CREATE INDEX IF NOT EXISTS idx_ride_commissions_partner_id ON public.ride_commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_ride_commissions_created_at ON public.ride_commissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ride_commissions_ride_id ON public.ride_commissions(ride_id);

-- Enable RLS
ALTER TABLE public.ride_commissions ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Chauffeurs peuvent voir leurs propres commissions"
  ON public.ride_commissions
  FOR SELECT
  USING (auth.uid() = driver_id);

CREATE POLICY "Partenaires peuvent voir commissions de leurs chauffeurs"
  ON public.ride_commissions
  FOR SELECT
  USING (auth.uid() = partner_id);

CREATE POLICY "Service peut insérer des commissions"
  ON public.ride_commissions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service peut mettre à jour des commissions"
  ON public.ride_commissions
  FOR UPDATE
  USING (true);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_ride_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_ride_commissions_updated_at ON public.ride_commissions;
CREATE TRIGGER trigger_ride_commissions_updated_at
  BEFORE UPDATE ON public.ride_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ride_commissions_updated_at();

-- =====================================================
-- Ajouter colonne commission_rate à partner_drivers si elle n'existe pas
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'partner_drivers' 
    AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE public.partner_drivers 
    ADD COLUMN commission_rate NUMERIC DEFAULT 2.5 CHECK (commission_rate >= 0 AND commission_rate <= 3);
  END IF;
END $$;

-- =====================================================
-- Mettre à jour les taux dans commission_settings
-- 12% Kwenda (platform), max 3% partenaire
-- =====================================================

UPDATE public.commission_settings 
SET 
  platform_rate = 12.0,
  admin_rate = 0,
  driver_rate = 85.0,
  updated_at = now()
WHERE is_active = true;