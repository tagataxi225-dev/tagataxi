
-- Table deferred_commissions pour les commissions différées
CREATE TABLE public.deferred_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  booking_id UUID NOT NULL,
  commission_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  deducted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX idx_deferred_commissions_driver ON public.deferred_commissions(driver_id);
CREATE INDEX idx_deferred_commissions_status ON public.deferred_commissions(status);

-- RLS
ALTER TABLE public.deferred_commissions ENABLE ROW LEVEL SECURITY;

-- Les chauffeurs voient leurs propres commissions différées
CREATE POLICY "Drivers can view own deferred commissions"
  ON public.deferred_commissions FOR SELECT
  USING (auth.uid() = driver_id);

-- Seules les edge functions (service role) peuvent insérer/modifier
CREATE POLICY "Service role can manage deferred commissions"
  ON public.deferred_commissions FOR ALL
  USING (true)
  WITH CHECK (true);
