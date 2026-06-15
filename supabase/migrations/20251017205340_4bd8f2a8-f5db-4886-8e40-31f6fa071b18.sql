-- ============================================
-- PHASE 5, 6 & 2 : TABLES BASE DE DONNÉES
-- ============================================

-- Table des notifications de tombola
CREATE TABLE IF NOT EXISTS public.lottery_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'card_won', 'reminder', 'event', 'prize_ready', 'pity_warning'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Index pour performance
CREATE INDEX idx_lottery_notifications_user_id ON public.lottery_notifications(user_id);
CREATE INDEX idx_lottery_notifications_read ON public.lottery_notifications(read) WHERE read = false;

-- RLS pour lottery_notifications
ALTER TABLE public.lottery_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own lottery notifications"
  ON public.lottery_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own lottery notifications"
  ON public.lottery_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Table des limites quotidiennes
CREATE TABLE IF NOT EXISTS public.lottery_user_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_limit INTEGER DEFAULT 5,
  cards_earned_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  vip_bonus INTEGER DEFAULT 0,
  unlimited_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS pour lottery_user_limits
ALTER TABLE public.lottery_user_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own limits"
  ON public.lottery_user_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own limits"
  ON public.lottery_user_limits FOR ALL
  USING (auth.uid() = user_id);

-- Table des super tombolas mensuelles
CREATE TABLE IF NOT EXISTS public.super_lottery_draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  draw_date TIMESTAMPTZ NOT NULL,
  entry_cost_points INTEGER DEFAULT 500,
  max_entries INTEGER,
  prize_pool JSONB, -- Liste des gros lots
  status TEXT DEFAULT 'upcoming', -- upcoming, active, drawn, completed
  winner_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS pour super_lottery_draws (public lecture)
ALTER TABLE public.super_lottery_draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view super lotteries"
  ON public.super_lottery_draws FOR SELECT
  USING (true);

CREATE POLICY "Admins manage super lotteries"
  ON public.super_lottery_draws FOR ALL
  USING (is_current_user_admin());

-- Table des entrées super tombola
CREATE TABLE IF NOT EXISTS public.super_lottery_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES public.super_lottery_draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  entry_number TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS pour super_lottery_entries
ALTER TABLE public.super_lottery_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own entries"
  ON public.super_lottery_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own entries"
  ON public.super_lottery_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Table des badges
CREATE TABLE IF NOT EXISTS public.user_lottery_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- RLS pour badges
ALTER TABLE public.user_lottery_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view all badges"
  ON public.user_lottery_badges FOR SELECT
  USING (true);

-- Table des événements spéciaux
CREATE TABLE IF NOT EXISTS public.lottery_special_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'christmas', 'independence', 'halloween', 'anniversary'
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  multiplier NUMERIC DEFAULT 1.0,
  special_prizes JSONB,
  card_design_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS pour événements
ALTER TABLE public.lottery_special_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active events"
  ON public.lottery_special_events FOR SELECT
  USING (is_active = true AND NOW() BETWEEN start_date AND end_date);

CREATE POLICY "Admins manage events"
  ON public.lottery_special_events FOR ALL
  USING (is_current_user_admin());

-- Table des actions admin
CREATE TABLE IF NOT EXISTS public.lottery_admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'update_probability', 'validate_prize', 'add_prize', 'create_event'
  action_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS pour admin actions
ALTER TABLE public.lottery_admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all actions"
  ON public.lottery_admin_actions FOR SELECT
  USING (is_current_user_admin());

CREATE POLICY "Admins create actions"
  ON public.lottery_admin_actions FOR INSERT
  WITH CHECK (is_current_user_admin() AND auth.uid() = admin_id);

-- Table de configuration dynamique
CREATE TABLE IF NOT EXISTS public.lottery_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  updated_by UUID REFERENCES public.admins(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS pour config
ALTER TABLE public.lottery_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view config"
  ON public.lottery_config FOR SELECT
  USING (true);

CREATE POLICY "Admins manage config"
  ON public.lottery_config FOR ALL
  USING (is_current_user_admin());

-- Fonction pour reset quotidien automatique
CREATE OR REPLACE FUNCTION reset_daily_lottery_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.lottery_user_limits
  SET 
    cards_earned_today = 0,
    last_reset_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE last_reset_date < CURRENT_DATE;
END;
$$;

-- Trigger pour auto-attribution de badges
CREATE OR REPLACE FUNCTION award_lottery_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_scratched INTEGER;
  total_rares INTEGER;
  total_legendaries INTEGER;
BEGIN
  -- Première carte
  INSERT INTO public.user_lottery_badges (user_id, badge_type, badge_name, badge_description)
  VALUES (NEW.user_id, 'first_scratch', '🎰 Première Carte', 'A gratté sa première carte')
  ON CONFLICT (user_id, badge_type) DO NOTHING;
  
  -- Compter les cartes grattées
  SELECT COUNT(*) INTO total_scratched
  FROM public.lottery_wins
  WHERE user_id = NEW.user_id AND scratch_revealed_at IS NOT NULL;
  
  -- Badge 100 cartes
  IF total_scratched >= 100 THEN
    INSERT INTO public.user_lottery_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (NEW.user_id, 'vip_platinum', '👑 VIP Platinum', 'A gratté 100 cartes')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  -- Compter les rares
  SELECT COUNT(*) INTO total_rares
  FROM public.lottery_wins
  WHERE user_id = NEW.user_id AND rarity = 'rare';
  
  IF total_rares >= 5 THEN
    INSERT INTO public.user_lottery_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (NEW.user_id, 'rare_collector', '💎 Collectionneur Rare', 'A gagné 5 cartes rares')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  -- Compter les legendaries
  SELECT COUNT(*) INTO total_legendaries
  FROM public.lottery_wins
  WHERE user_id = NEW.user_id AND rarity = 'legendary';
  
  IF total_legendaries >= 1 THEN
    INSERT INTO public.user_lottery_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (NEW.user_id, 'lucky_month', '🌟 Chanceux du Mois', 'A gagné une carte légendaire')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger sur lottery_wins pour badges
DROP TRIGGER IF EXISTS trigger_award_lottery_badges ON public.lottery_wins;
CREATE TRIGGER trigger_award_lottery_badges
  AFTER UPDATE ON public.lottery_wins
  FOR EACH ROW
  WHEN (NEW.scratch_revealed_at IS NOT NULL AND OLD.scratch_revealed_at IS NULL)
  EXECUTE FUNCTION award_lottery_badges();