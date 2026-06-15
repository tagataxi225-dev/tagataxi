-- Création des tables pour le système Kwenda Marchand et marketplace amélioré

-- Table des wallets vendeurs (Kwenda Marchand)
CREATE TABLE public.vendor_wallets (
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
CREATE TABLE public.vendor_wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.vendor_wallets(id),
  vendor_id UUID NOT NULL,
  transaction_type TEXT NOT NULL, -- 'credit', 'debit', 'withdrawal'
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  description TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT, -- 'sale', 'withdrawal', 'commission'
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des abonnements clients aux vendeurs
CREATE TABLE public.vendor_subscriptions (
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

-- Table des notifications vendeurs
CREATE TABLE public.vendor_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  customer_id UUID,
  order_id UUID,
  notification_type TEXT NOT NULL, -- 'new_order', 'new_subscriber', 'payment_received', 'withdrawal_completed'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des frais de livraison configurables
CREATE TABLE public.delivery_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type TEXT NOT NULL DEFAULT 'marketplace',
  base_fee NUMERIC NOT NULL DEFAULT 7000,
  currency TEXT NOT NULL DEFAULT 'CDF',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des demandes de retrait vendeur
CREATE TABLE public.vendor_withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  wallet_id UUID NOT NULL REFERENCES public.vendor_wallets(id),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  withdrawal_method TEXT NOT NULL, -- 'orange_money', 'm_pesa', 'airtel_money'
  phone_number TEXT NOT NULL,
  provider_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  fees_amount NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Étendre la table commission_settings pour marketplace
INSERT INTO public.commission_settings (service_type, admin_rate, driver_rate, platform_rate, is_active)
VALUES ('marketplace', 15.00, 0.00, 85.00, true)
ON CONFLICT DO NOTHING;

-- Insérer les frais de livraison par défaut
INSERT INTO public.delivery_fees (service_type, base_fee, currency, is_active)
VALUES ('marketplace', 7000, 'CDF', true)
ON CONFLICT DO NOTHING;

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE public.vendor_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_withdrawals ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour vendor_wallets
CREATE POLICY "Vendors can view their own wallet" 
ON public.vendor_wallets 
FOR SELECT 
USING (auth.uid() = vendor_id);

CREATE POLICY "System can manage vendor wallets" 
ON public.vendor_wallets 
FOR ALL 
USING (true);

-- Politiques RLS pour vendor_wallet_transactions
CREATE POLICY "Vendors can view their own transactions" 
ON public.vendor_wallet_transactions 
FOR SELECT 
USING (auth.uid() = vendor_id);

CREATE POLICY "System can create vendor transactions" 
ON public.vendor_wallet_transactions 
FOR INSERT 
WITH CHECK (true);

-- Politiques RLS pour vendor_subscriptions
CREATE POLICY "Users can manage their own subscriptions" 
ON public.vendor_subscriptions 
FOR ALL 
USING (auth.uid() = customer_id);

CREATE POLICY "Vendors can view their subscribers" 
ON public.vendor_subscriptions 
FOR SELECT 
USING (auth.uid() = vendor_id);

-- Politiques RLS pour vendor_notifications
CREATE POLICY "Vendors can view their own notifications" 
ON public.vendor_notifications 
FOR SELECT 
USING (auth.uid() = vendor_id);

CREATE POLICY "System can create vendor notifications" 
ON public.vendor_notifications 
FOR INSERT 
WITH CHECK (true);

-- Politiques RLS pour delivery_fees
CREATE POLICY "Everyone can view active delivery fees" 
ON public.delivery_fees 
FOR SELECT 
USING (is_active = true);

-- Politiques RLS pour vendor_withdrawals
CREATE POLICY "Vendors can manage their own withdrawals" 
ON public.vendor_withdrawals 
FOR ALL 
USING (auth.uid() = vendor_id);

-- Triggers pour updated_at
CREATE TRIGGER update_vendor_wallets_updated_at
BEFORE UPDATE ON public.vendor_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_subscriptions_updated_at
BEFORE UPDATE ON public.vendor_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_fees_updated_at
BEFORE UPDATE ON public.delivery_fees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_withdrawals_updated_at
BEFORE UPDATE ON public.vendor_withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();