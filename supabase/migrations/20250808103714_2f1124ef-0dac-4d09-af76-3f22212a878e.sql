-- Tables pour le système de gestion financière partenaire

-- Table pour suivre précisément les commissions des partenaires
CREATE TABLE IF NOT EXISTS public.partner_commission_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  booking_id UUID NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('transport', 'delivery')),
  commission_rate NUMERIC NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  commission_amount NUMERIC NOT NULL CHECK (commission_amount >= 0),
  booking_amount NUMERIC NOT NULL CHECK (booking_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'CDF',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les demandes de retrait des partenaires
CREATE TABLE IF NOT EXISTS public.partner_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'CDF',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  payment_method TEXT NOT NULL,
  account_details JSONB NOT NULL DEFAULT '{}',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS pour partner_commission_tracking
ALTER TABLE public.partner_commission_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their own commission tracking"
ON public.partner_commission_tracking
FOR SELECT 
USING (auth.uid() = partner_id);

CREATE POLICY "System can insert commission tracking"
ON public.partner_commission_tracking
FOR INSERT 
WITH CHECK (true);

-- RLS pour partner_withdrawals
ALTER TABLE public.partner_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their own withdrawals"
ON public.partner_withdrawals
FOR SELECT 
USING (auth.uid() = partner_id);

CREATE POLICY "Partners can create withdrawal requests"
ON public.partner_withdrawals
FOR INSERT 
WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "Partners can update their pending withdrawals"
ON public.partner_withdrawals
FOR UPDATE 
USING (auth.uid() = partner_id AND status = 'pending');

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_partner_commission_tracking_partner_id ON public.partner_commission_tracking(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_commission_tracking_driver_id ON public.partner_commission_tracking(driver_id);
CREATE INDEX IF NOT EXISTS idx_partner_commission_tracking_created_at ON public.partner_commission_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_partner_withdrawals_partner_id ON public.partner_withdrawals(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_withdrawals_status ON public.partner_withdrawals(status);

-- Trigger pour updated_at
CREATE TRIGGER update_partner_commission_tracking_updated_at
  BEFORE UPDATE ON public.partner_commission_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_withdrawals_updated_at
  BEFORE UPDATE ON public.partner_withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();