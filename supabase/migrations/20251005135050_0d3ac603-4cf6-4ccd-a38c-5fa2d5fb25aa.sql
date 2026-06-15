-- =====================================================
-- PHASE 1 : MIGRATION KWENDA TAXI - BASE DE DONNÉES
-- Passage du modèle commissions → 100% abonnements
-- =====================================================

-- 1. NOUVELLE TABLE : Gains partenaires sur abonnements chauffeurs (5%)
CREATE TABLE IF NOT EXISTS public.partner_subscription_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partenaires(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  subscription_id UUID NOT NULL REFERENCES public.driver_subscriptions(id) ON DELETE CASCADE,
  subscription_amount NUMERIC(10,2) NOT NULL,
  partner_commission_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  partner_commission_amount NUMERIC(10,2) NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_partner_subscription_earnings_partner ON public.partner_subscription_earnings(partner_id);
CREATE INDEX idx_partner_subscription_earnings_driver ON public.partner_subscription_earnings(driver_id);
CREATE INDEX idx_partner_subscription_earnings_status ON public.partner_subscription_earnings(status);
CREATE INDEX idx_partner_subscription_earnings_date ON public.partner_subscription_earnings(payment_date DESC);

ALTER TABLE public.partner_subscription_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners view own subscription earnings"
  ON public.partner_subscription_earnings FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.partenaires WHERE id = partner_id));

CREATE POLICY "Admins manage subscription earnings"
  ON public.partner_subscription_earnings FOR ALL
  USING (public.is_current_user_admin());

CREATE TRIGGER update_partner_subscription_earnings_updated_at
  BEFORE UPDATE ON public.partner_subscription_earnings
  FOR EACH ROW EXECUTE FUNCTION public.update_driver_assignment_timestamp();

COMMENT ON TABLE public.partner_subscription_earnings IS 'Tracking gains partenaires (5%) sur abonnements chauffeurs - Kwenda Taxi';

-- =====================================================
-- 2. NOUVELLE TABLE : Plans abonnements vendeurs
-- =====================================================

CREATE TABLE IF NOT EXISTS public.vendor_subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  duration_days INTEGER NOT NULL DEFAULT 30,
  duration_type TEXT NOT NULL DEFAULT 'monthly' CHECK (duration_type IN ('monthly', 'quarterly', 'yearly')),
  max_products INTEGER NOT NULL DEFAULT 10,
  max_photos_per_product INTEGER DEFAULT 5,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_subscription_plans_active ON public.vendor_subscription_plans(is_active, display_order);

ALTER TABLE public.vendor_subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View active vendor plans"
  ON public.vendor_subscription_plans FOR SELECT
  USING (is_active = true OR public.is_current_user_admin());

CREATE POLICY "Admins manage vendor plans"
  ON public.vendor_subscription_plans FOR ALL
  USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TRIGGER update_vendor_subscription_plans_updated_at
  BEFORE UPDATE ON public.vendor_subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_driver_assignment_timestamp();

COMMENT ON TABLE public.vendor_subscription_plans IS 'Plans abonnements vendeurs (futur) - Kwenda Taxi';

-- =====================================================
-- 3. DÉPRÉCIATION COMMISSIONS
-- =====================================================

UPDATE public.commission_configuration 
SET deprecated = true, deprecated_at = now(),
    deprecation_reason = 'Migration Kwenda Taxi - Modèle 100% abonnements', is_active = false
WHERE deprecated IS NOT true OR deprecated IS NULL;

UPDATE public.commission_settings 
SET deprecated = true, deprecated_at = now(),
    deprecation_reason = 'Migration Kwenda Taxi - Modèle 100% abonnements', is_active = false
WHERE deprecated IS NOT true OR deprecated IS NULL;

-- =====================================================
-- 4. FONCTION : Gains partenaire
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_partner_subscription_balance(p_partner_id UUID)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_balance NUMERIC;
BEGIN
  SELECT COALESCE(SUM(CASE WHEN status = 'paid' THEN partner_commission_amount ELSE 0 END), 0)
  INTO v_balance FROM public.partner_subscription_earnings WHERE partner_id = p_partner_id;
  RETURN v_balance;
END; $$;

COMMENT ON FUNCTION public.get_partner_subscription_balance IS 'Calcule gains abonnements partenaire - Kwenda Taxi';

-- =====================================================
-- 5. LOG MIGRATION
-- =====================================================

INSERT INTO public.data_migration_logs (migration_type, success, migration_data)
VALUES ('kwenda_taxi_phase1', true, jsonb_build_object(
  'phase', 1, 'app_name', 'Kwenda Taxi',
  'changes', 'Tables partner_subscription_earnings + vendor_subscription_plans créées, commissions dépréciées'
));