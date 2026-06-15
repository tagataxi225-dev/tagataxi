-- =======================
-- MIGRATION: Production Features - Tables manquantes uniquement
-- =======================

-- 1. CODES PROMO ET PARRAINAGE
-- =======================

-- Table pour les codes promo (si elle n'existe pas)
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'promo_codes') THEN
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
          user_limit INTEGER DEFAULT 1,
          valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
          applicable_services TEXT[] DEFAULT ARRAY['transport', 'delivery', 'marketplace'],
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
    END IF;
END $$;

-- Table pour l'utilisation des codes promo
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'promo_code_usage') THEN
        CREATE TABLE public.promo_code_usage (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          order_id UUID,
          order_type TEXT NOT NULL CHECK (order_type IN ('transport', 'delivery', 'marketplace')),
          discount_amount NUMERIC NOT NULL,
          currency TEXT NOT NULL DEFAULT 'CDF',
          used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          UNIQUE(promo_code_id, user_id, order_id)
        );
    END IF;
END $$;

-- Table pour le système de parrainage
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'referral_system') THEN
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
    END IF;
END $$;

-- 2. ADRESSES SAUVEGARDÉES
-- =======================

DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'saved_addresses') THEN
        CREATE TABLE public.saved_addresses (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          label TEXT NOT NULL,
          address_line TEXT NOT NULL,
          city TEXT NOT NULL DEFAULT 'Kinshasa',
          commune TEXT,
          quartier TEXT,
          coordinates JSONB,
          is_default BOOLEAN NOT NULL DEFAULT false,
          address_type TEXT DEFAULT 'personal' CHECK (address_type IN ('personal', 'business')),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
    END IF;
END $$;

-- 3. SUPPORT CLIENT (sans support_messages qui existe déjà)
-- =======================

DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'support_categories') THEN
        CREATE TABLE public.support_categories (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          is_active BOOLEAN NOT NULL DEFAULT true,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
    END IF;
END $$;

-- 4. SÉCURITÉ ET VÉRIFICATION
-- =======================

DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'user_verifications') THEN
        CREATE TABLE public.user_verifications (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          verification_type TEXT NOT NULL CHECK (verification_type IN ('phone', 'email', 'identity', 'address')),
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
          verification_data JSONB,
          verified_at TIMESTAMP WITH TIME ZONE,
          verified_by UUID REFERENCES auth.users(id),
          expires_at TIMESTAMP WITH TIME ZONE,
          attempts_count INTEGER NOT NULL DEFAULT 0,
          max_attempts INTEGER NOT NULL DEFAULT 3,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          UNIQUE(user_id, verification_type)
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'user_security_settings') THEN
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
    END IF;
END $$;

-- 5. COMPTES ENTREPRISE
-- =======================

DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'business_accounts') THEN
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
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'business_team_members') THEN
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
    END IF;
END $$;

-- 6. PARAMÈTRES UTILISATEUR
-- =======================

DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'user_preferences') THEN
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
    END IF;
END $$;

-- 7. HISTORIQUE ET ACTIVITÉS
-- =======================

DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'user_activity_log') THEN
        CREATE TABLE public.user_activity_log (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          activity_type TEXT NOT NULL,
          description TEXT NOT NULL,
          entity_type TEXT,
          entity_id UUID,
          metadata JSONB DEFAULT '{}',
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
    END IF;
END $$;

-- =======================
-- FONCTIONS ET DONNÉES INITIALES
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

-- Catégories de support par défaut (seulement si la table existe et est vide)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'support_categories')
       AND NOT EXISTS (SELECT 1 FROM public.support_categories LIMIT 1) THEN
        INSERT INTO public.support_categories (name, description, icon, sort_order) VALUES
        ('Transport', 'Problèmes liés aux courses et chauffeurs', 'car', 1),
        ('Livraison', 'Questions sur les livraisons', 'package', 2),
        ('Paiement', 'Problèmes de paiement et facturation', 'credit-card', 3),
        ('Compte', 'Gestion du compte utilisateur', 'user', 4),
        ('Technique', 'Problèmes techniques de l''application', 'settings', 5),
        ('Autre', 'Autres questions', 'help-circle', 6);
    END IF;
END $$;

-- Codes promo par défaut (seulement si la table existe et est vide)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'promo_codes')
       AND NOT EXISTS (SELECT 1 FROM public.promo_codes LIMIT 1) THEN
        INSERT INTO public.promo_codes (code, title, description, discount_type, discount_value, min_order_amount, usage_limit, valid_until, applicable_services) VALUES
        ('WELCOME20', 'Bienvenue - 20% de réduction', 'Réduction de 20% pour les nouveaux utilisateurs', 'percentage', 20, 5000, 1000, NOW() + INTERVAL '3 months', ARRAY['transport', 'delivery']),
        ('FREEDELIVERY', 'Livraison gratuite', 'Livraison gratuite pour commandes de plus de 10000 CDF', 'free_delivery', 0, 10000, 500, NOW() + INTERVAL '1 month', ARRAY['delivery']),
        ('SAVE5000', '5000 CDF de réduction', 'Réduction fixe de 5000 CDF', 'fixed_amount', 5000, 15000, 200, NOW() + INTERVAL '2 months', ARRAY['transport', 'delivery', 'marketplace']);
    END IF;
END $$;