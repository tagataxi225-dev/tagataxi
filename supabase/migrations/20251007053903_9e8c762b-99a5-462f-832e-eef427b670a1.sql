-- ============================================
-- PHASE 2: Table des préférences utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_categories TEXT[] DEFAULT '{}',
  price_range_min NUMERIC,
  price_range_max NUMERIC,
  preferred_sellers UUID[] DEFAULT '{}',
  browsing_history JSONB DEFAULT '[]'::jsonb,
  purchase_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences"
ON public.user_preferences FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON public.user_preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON public.user_preferences FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_user_preferences_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_user_preferences_timestamp();

-- ============================================
-- PHASE 6: Table des promotions marketplace
-- ============================================
CREATE TABLE IF NOT EXISTS public.marketplace_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  discount_percentage NUMERIC NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  original_price NUMERIC NOT NULL,
  discounted_price NUMERIC NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  promotion_type TEXT DEFAULT 'flash_sale',
  max_quantity INTEGER,
  remaining_quantity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date > start_date),
  CHECK (discounted_price < original_price)
);

-- Enable RLS
ALTER TABLE public.marketplace_promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active promotions"
ON public.marketplace_promotions FOR SELECT
TO authenticated
USING (is_active = true AND end_date > NOW());

CREATE POLICY "Sellers manage own promotions"
ON public.marketplace_promotions FOR ALL
TO authenticated
USING (auth.uid() = seller_id);

CREATE POLICY "Admins manage all promotions"
ON public.marketplace_promotions FOR ALL
TO authenticated
USING (is_current_user_admin());

-- Index for performance
CREATE INDEX idx_promotions_active ON public.marketplace_promotions(is_active, end_date) WHERE is_active = true;
CREATE INDEX idx_promotions_product ON public.marketplace_promotions(product_id);

-- ============================================
-- PHASE 10: Table des interactions IA
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  context TEXT,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  function_called TEXT,
  function_result JSONB,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users view own AI interactions"
ON public.ai_interactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all AI interactions"
ON public.ai_interactions FOR SELECT
TO authenticated
USING (is_current_user_admin());

-- Index for analytics
CREATE INDEX idx_ai_interactions_user ON public.ai_interactions(user_id, created_at DESC);
CREATE INDEX idx_ai_interactions_function ON public.ai_interactions(function_called, success);
CREATE INDEX idx_ai_interactions_context ON public.ai_interactions(context, created_at DESC);

-- ============================================
-- Vue matérialisée pour analytics IA
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.ai_performance_stats AS
SELECT 
  context,
  function_called,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success = true) as successful_calls,
  COUNT(*) FILTER (WHERE success = false) as failed_calls,
  ROUND(AVG(response_time_ms)::numeric, 2) as avg_response_time_ms,
  DATE_TRUNC('day', created_at) as day
FROM public.ai_interactions
GROUP BY context, function_called, DATE_TRUNC('day', created_at);

-- Index sur la vue matérialisée
CREATE INDEX idx_ai_stats_context ON public.ai_performance_stats(context, day DESC);

-- Fonction pour rafraîchir les stats
CREATE OR REPLACE FUNCTION public.refresh_ai_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.ai_performance_stats;
END;
$$;