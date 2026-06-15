-- Création des tables pour Kwenda Marchand avec corrections

-- Table des wallets vendeurs
CREATE TABLE IF NOT EXISTS public.vendor_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CDF',
  total_earned NUMERIC NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC NOT NULL DEFAULT 0,
  last_withdrawal_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, currency)
);

-- Table des transactions wallet vendeur
CREATE TABLE IF NOT EXISTS public.vendor_wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  transaction_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  description TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des abonnements clients aux vendeurs
CREATE TABLE IF NOT EXISTS public.vendor_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notification_preferences JSONB DEFAULT '{"new_products": true, "promotions": true, "price_drops": true}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, vendor_id)
);

-- Table des frais de livraison
CREATE TABLE IF NOT EXISTS public.delivery_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type TEXT NOT NULL DEFAULT 'marketplace',
  base_fee NUMERIC NOT NULL DEFAULT 7000,
  currency TEXT NOT NULL DEFAULT 'CDF',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des retraits vendeur
CREATE TABLE IF NOT EXISTS public.vendor_withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  wallet_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  withdrawal_method TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  provider_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  fees_amount NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Configuration marketplace dans commission_settings
DO $$
BEGIN
  INSERT INTO public.commission_settings (service_type, admin_rate, driver_rate, platform_rate, is_active)
  VALUES ('marketplace', 15.00, 0.00, 85.00, true);
EXCEPTION WHEN unique_violation THEN
  -- Configuration déjà existante
END $$;

-- Configuration frais de livraison
DO $$
BEGIN
  INSERT INTO public.delivery_fees (service_type, base_fee, currency, is_active)
  VALUES ('marketplace', 7000, 'CDF', true);
EXCEPTION WHEN unique_violation THEN
  -- Configuration déjà existante
END $$;

-- Activer RLS
ALTER TABLE public.vendor_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_withdrawals ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Vendors can view their wallet" ON public.vendor_wallets FOR SELECT USING (auth.uid() = vendor_id);
CREATE POLICY "System manages vendor wallets" ON public.vendor_wallets FOR ALL USING (true);
CREATE POLICY "Vendors can view their transactions" ON public.vendor_wallet_transactions FOR SELECT USING (auth.uid() = vendor_id);
CREATE POLICY "System creates vendor transactions" ON public.vendor_wallet_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users manage subscriptions" ON public.vendor_subscriptions FOR ALL USING (auth.uid() = customer_id);
CREATE POLICY "Vendors view subscribers" ON public.vendor_subscriptions FOR SELECT USING (auth.uid() = vendor_id);
CREATE POLICY "View active delivery fees" ON public.delivery_fees FOR SELECT USING (is_active = true);
CREATE POLICY "Vendors manage withdrawals" ON public.vendor_withdrawals FOR ALL USING (auth.uid() = vendor_id);