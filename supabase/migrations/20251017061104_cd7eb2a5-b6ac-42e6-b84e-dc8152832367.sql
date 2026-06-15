-- Create marketing campaigns tables

-- Campaigns master table
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target TEXT NOT NULL CHECK (target IN ('clients', 'drivers', 'partners', 'all')),
  city TEXT NOT NULL,
  headline TEXT NOT NULL,
  subheadline TEXT NOT NULL,
  hero_image TEXT,
  hero_video TEXT,
  offer JSONB NOT NULL DEFAULT '{}',
  cta_primary TEXT NOT NULL,
  cta_secondary TEXT,
  colors JSONB NOT NULL DEFAULT '{"primary": "#DC2626", "accent": "#F59E0B"}',
  countdown BOOLEAN DEFAULT false,
  scarcity JSONB,
  testimonials TEXT,
  share_buttons JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Campaign visitors tracking
CREATE TABLE IF NOT EXISTS public.campaign_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  qr_channel TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  user_agent TEXT,
  referrer TEXT,
  ip_address TEXT,
  city TEXT,
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Campaign conversions
CREATE TABLE IF NOT EXISTS public.campaign_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES public.campaign_visitors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conversion_value NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Campaign events tracking
CREATE TABLE IF NOT EXISTS public.campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES public.campaign_visitors(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_campaigns (public read)
CREATE POLICY "Anyone can view active campaigns"
  ON public.marketing_campaigns
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage campaigns"
  ON public.marketing_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for campaign_visitors (insert only for visitors, full access for admins)
CREATE POLICY "Anyone can record visits"
  ON public.campaign_visitors
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all visitors"
  ON public.campaign_visitors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update visitors"
  ON public.campaign_visitors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for campaign_conversions
CREATE POLICY "Anyone can record conversions"
  ON public.campaign_conversions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all conversions"
  ON public.campaign_conversions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for campaign_events
CREATE POLICY "Anyone can record events"
  ON public.campaign_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all events"
  ON public.campaign_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_campaign_visitors_campaign_id ON public.campaign_visitors(campaign_id);
CREATE INDEX idx_campaign_visitors_created_at ON public.campaign_visitors(created_at);
CREATE INDEX idx_campaign_conversions_campaign_id ON public.campaign_conversions(campaign_id);
CREATE INDEX idx_campaign_events_campaign_id ON public.campaign_events(campaign_id);
CREATE INDEX idx_campaign_events_visitor_id ON public.campaign_events(visitor_id);

-- Insert default campaigns
INSERT INTO public.marketing_campaigns (id, name, target, city, headline, subheadline, offer, cta_primary, colors) VALUES
('kinshasa-launch', 'Lancement Kinshasa', 'clients', 'Kinshasa', '🔥 Kinshasa : -50% sur ta première course !', 'Rejoins 12,000+ Kinois qui utilisent déjà Kwenda', '{"bonus_credits": 2000, "first_ride_discount": 50, "lottery_tickets": 5, "expiry": "2025-12-31"}', 'Profiter de -50%', '{"primary": "#DC2626", "accent": "#F59E0B"}'),
('driver-recruitment', 'Recrutement Chauffeurs', 'drivers', 'all', '💰 Deviens chauffeur Kwenda et gagne jusqu''à 200,000 CDF/mois', 'Formation gratuite • Flexibilité totale • Revenus réguliers', '{"signup_bonus": 5000, "first_week_guarantee": 15000, "free_training": true, "zero_commission_period": 14}', 'Devenir chauffeur', '{"primary": "#F59E0B", "accent": "#DC2626"}'),
('lubumbashi-expansion', 'Extension Lubumbashi', 'clients', 'Lubumbashi', '🎉 Kwenda arrive à Lubumbashi !', 'Profite de l''offre de lancement exclusive', '{"bonus_credits": 3000, "first_ride_discount": 50, "lottery_tickets": 10, "expiry": "2025-12-31"}', 'Découvrir l''offre', '{"primary": "#DC2626", "accent": "#F59E0B"}'),
('referral-boost', 'Boost Parrainage', 'clients', 'all', '👥 Parraine 5 amis = 10,000 CDF GRATUITS', 'Plus tu parraines, plus tu gagnes. Illimité !', '{"referral_bonus": 2000, "referee_bonus": 2000, "milestone_rewards": [{"count": 5, "reward": 10000}, {"count": 10, "reward": 25000}, {"count": 20, "reward": 60000}]}', 'Commencer à parrainer', '{"primary": "#10B981", "accent": "#3B82F6"}')
ON CONFLICT (id) DO NOTHING;