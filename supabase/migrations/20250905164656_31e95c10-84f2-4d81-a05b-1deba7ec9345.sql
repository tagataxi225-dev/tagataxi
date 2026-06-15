-- =======================
-- MIGRATION: Correction des problèmes de sécurité RLS
-- =======================

-- Activer RLS sur toutes les nouvelles tables et créer les policies

-- 1. Promo codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promo codes - Public read active codes" ON public.promo_codes
  FOR SELECT USING (is_active = true AND valid_until > NOW());

CREATE POLICY "Promo codes - Admin manage" ON public.promo_codes
  FOR ALL USING (is_current_user_admin());

-- 2. Promo code usage
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promo usage - Users view own" ON public.promo_code_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Promo usage - Users insert own" ON public.promo_code_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Promo usage - Admin view all" ON public.promo_code_usage
  FOR SELECT USING (is_current_user_admin());

-- 3. Referral system
ALTER TABLE public.referral_system ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrals - Users access own" ON public.referral_system
  FOR ALL USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Referrals - Admin manage" ON public.referral_system
  FOR ALL USING (is_current_user_admin());

-- 4. Saved addresses
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Addresses - Users manage own" ON public.saved_addresses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Support categories
ALTER TABLE public.support_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support categories - Public read" ON public.support_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Support categories - Admin manage" ON public.support_categories
  FOR ALL USING (is_current_user_admin());

-- 6. User verifications
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verifications - Users manage own" ON public.user_verifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Verifications - Admin manage all" ON public.user_verifications
  FOR ALL USING (is_current_user_admin());

-- 7. User security settings
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Security settings - Users manage own" ON public.user_security_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. Business accounts
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business accounts - Owners manage" ON public.business_accounts
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Business accounts - Admin view" ON public.business_accounts
  FOR SELECT USING (is_current_user_admin());

-- 9. Business team members
ALTER TABLE public.business_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members - Business access" ON public.business_team_members
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.business_accounts WHERE id = business_id AND owner_id = auth.uid()) OR
    is_current_user_admin()
  );

-- 10. User preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Preferences - Users manage own" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11. User activity log
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity log - Users view own" ON public.user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Activity log - System insert" ON public.user_activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Activity log - Admin view all" ON public.user_activity_log
  FOR SELECT USING (is_current_user_admin());

-- Correction des fonctions avec search_path sécurisé
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;