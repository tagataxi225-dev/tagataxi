-- =======================
-- MIGRATION: Production Features Implementation
-- =======================

-- 1. CODES PROMO ET PARRAINAGE
-- =======================

-- Table pour les codes promo
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_delivery')),
  discount_value NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  min_order_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  user_limit INTEGER DEFAULT 1, -- Limite par utilisateur
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  applicable_services TEXT[] DEFAULT ARRAY['transport', 'delivery', 'marketplace'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour l'utilisation des codes promo
CREATE TABLE public.promo_code_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID, -- Peut référencer différents types de commandes
  order_type TEXT NOT NULL CHECK (order_type IN ('transport', 'delivery', 'marketplace')),
  discount_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(promo_code_id, user_id, order_id)
);

-- Table pour le système de parrainage
CREATE TABLE public.referral_system (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  referrer_reward_amount NUMERIC DEFAULT 5000,
  referee_reward_amount NUMERIC DEFAULT 3000,
  currency TEXT NOT NULL DEFAULT 'CDF',
  completed_at TIMESTAMP WITH TIME ZONE,
  rewarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referee_id)
);

-- 2. ADRESSES SAUVEGARDÉES
-- =======================

CREATE TABLE public.saved_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- Maison, Bureau, etc.
  address_line TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Kinshasa',
  commune TEXT,
  quartier TEXT,
  coordinates JSONB, -- {lat: number, lng: number}
  is_default BOOLEAN NOT NULL DEFAULT false,
  address_type TEXT DEFAULT 'personal' CHECK (address_type IN ('personal', 'business')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. SUPPORT CLIENT
-- =======================

CREATE TABLE public.support_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.support_categories(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES auth.users(id),
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_internal BOOLEAN NOT NULL DEFAULT false, -- Messages internes entre support
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. SÉCURITÉ ET VÉRIFICATION
-- =======================

CREATE TABLE public.user_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('phone', 'email', 'identity', 'address')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
  verification_data JSONB, -- Documents, codes, etc.
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  attempts_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, verification_type)
);

CREATE TABLE public.user_security_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  login_notifications BOOLEAN NOT NULL DEFAULT true,
  transaction_notifications BOOLEAN NOT NULL DEFAULT true,
  privacy_mode BOOLEAN NOT NULL DEFAULT false,
  data_sharing_consent BOOLEAN NOT NULL DEFAULT false,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  location_tracking BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. COMPTES ENTREPRISE
-- =======================

CREATE TABLE public.business_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_registration TEXT,
  tax_number TEXT,
  business_type TEXT CHECK (business_type IN ('startup', 'sme', 'corporation', 'ngo')),
  industry TEXT,
  employee_count INTEGER,
  monthly_budget NUMERIC,
  currency TEXT NOT NULL DEFAULT 'CDF',
  billing_address JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'closed')),
  subscription_plan TEXT DEFAULT 'basic',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.business_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- 6. PARAMÈTRES UTILISATEUR
-- =======================

CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  language TEXT NOT NULL DEFAULT 'fr' CHECK (language IN ('fr', 'en')),
  currency TEXT NOT NULL DEFAULT 'CDF',
  timezone TEXT NOT NULL DEFAULT 'Africa/Kinshasa',
  notification_preferences JSONB NOT NULL DEFAULT '{
    "push_notifications": true,
    "email_notifications": true,
    "sms_notifications": false,
    "promotion_notifications": true,
    "order_updates": true,
    "driver_updates": true,
    "payment_alerts": true
  }',
  app_theme TEXT NOT NULL DEFAULT 'system' CHECK (app_theme IN ('light', 'dark', 'system')),
  default_payment_method TEXT,
  auto_save_addresses BOOLEAN NOT NULL DEFAULT true,
  share_location BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. HISTORIQUE ET ACTIVITÉS
-- =======================

CREATE TABLE public.user_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_type TEXT, -- 'order', 'payment', 'profile', etc.
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =======================
-- TRIGGERS ET FONCTIONS
-- =======================

-- Fonction pour générer des codes de parrainage uniques
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    code := 'REF' || UPPER(substr(md5(random()::text), 1, 6));
    SELECT COUNT(*) INTO exists_check FROM public.referral_system WHERE referral_code = code;
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer des numéros de tickets
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  ticket_num TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    ticket_num := 'TK' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(floor(random() * 9999)::text, 4, '0');
    SELECT COUNT(*) INTO exists_check FROM public.support_tickets WHERE ticket_number = ticket_num;
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour les numéros de tickets
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger à toutes les tables nécessaires
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_addresses_updated_at
  BEFORE UPDATE ON public.saved_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_verifications_updated_at
  BEFORE UPDATE ON public.user_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_security_settings_updated_at
  BEFORE UPDATE ON public.user_security_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_accounts_updated_at
  BEFORE UPDATE ON public.business_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- DONNÉES INITIALES
-- =======================

-- Catégories de support par défaut
INSERT INTO public.support_categories (name, description, icon, sort_order) VALUES
('Transport', 'Problèmes liés aux courses et chauffeurs', 'car', 1),
('Livraison', 'Questions sur les livraisons', 'package', 2),
('Paiement', 'Problèmes de paiement et facturation', 'credit-card', 3),
('Compte', 'Gestion du compte utilisateur', 'user', 4),
('Technique', 'Problèmes techniques de l''application', 'settings', 5),
('Autre', 'Autres questions', 'help-circle', 6);

-- Codes promo par défaut
INSERT INTO public.promo_codes (code, title, description, discount_type, discount_value, min_order_amount, usage_limit, valid_until, applicable_services) VALUES
('WELCOME20', 'Bienvenue - 20% de réduction', 'Réduction de 20% pour les nouveaux utilisateurs', 'percentage', 20, 5000, 1000, NOW() + INTERVAL '3 months', ARRAY['transport', 'delivery']),
('FREEDELIVERY', 'Livraison gratuite', 'Livraison gratuite pour commandes de plus de 10000 CDF', 'free_delivery', 0, 10000, 500, NOW() + INTERVAL '1 month', ARRAY['delivery']),
('SAVE5000', '5000 CDF de réduction', 'Réduction fixe de 5000 CDF', 'fixed_amount', 5000, 15000, 200, NOW() + INTERVAL '2 months', ARRAY['transport', 'delivery', 'marketplace']);

-- =======================
-- RLS POLICIES
-- =======================

-- Promo codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promo codes - Public read active codes" ON public.promo_codes
  FOR SELECT USING (is_active = true AND valid_until > NOW());

CREATE POLICY "Promo codes - Admin manage" ON public.promo_codes
  FOR ALL USING (is_current_user_admin());

-- Promo code usage
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promo usage - Users view own" ON public.promo_code_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Promo usage - Users insert own" ON public.promo_code_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Promo usage - Admin view all" ON public.promo_code_usage
  FOR SELECT USING (is_current_user_admin());

-- Referral system
ALTER TABLE public.referral_system ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrals - Users access own" ON public.referral_system
  FOR ALL USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Referrals - Admin manage" ON public.referral_system
  FOR ALL USING (is_current_user_admin());

-- Saved addresses
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Addresses - Users manage own" ON public.saved_addresses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Support categories
ALTER TABLE public.support_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support categories - Public read" ON public.support_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Support categories - Admin manage" ON public.support_categories
  FOR ALL USING (is_current_user_admin());

-- Support tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support tickets - Users manage own" ON public.support_tickets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Support tickets - Admin manage all" ON public.support_tickets
  FOR ALL USING (is_current_user_admin());

-- Support messages
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support messages - Ticket participants" ON public.support_messages
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid()) OR
    is_current_user_admin()
  );

CREATE POLICY "Support messages - Users insert" ON public.support_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
  );

CREATE POLICY "Support messages - Admin insert" ON public.support_messages
  FOR INSERT WITH CHECK (is_current_user_admin());

-- User verifications
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verifications - Users manage own" ON public.user_verifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Verifications - Admin manage all" ON public.user_verifications
  FOR ALL USING (is_current_user_admin());

-- User security settings
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Security settings - Users manage own" ON public.user_security_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Business accounts
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business accounts - Owners manage" ON public.business_accounts
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Business accounts - Admin view" ON public.business_accounts
  FOR SELECT USING (is_current_user_admin());

-- Business team members
ALTER TABLE public.business_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members - Business access" ON public.business_team_members
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.business_accounts WHERE id = business_id AND owner_id = auth.uid()) OR
    is_current_user_admin()
  );

-- User preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Preferences - Users manage own" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User activity log
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity log - Users view own" ON public.user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Activity log - System insert" ON public.user_activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Activity log - Admin view all" ON public.user_activity_log
  FOR SELECT USING (is_current_user_admin());