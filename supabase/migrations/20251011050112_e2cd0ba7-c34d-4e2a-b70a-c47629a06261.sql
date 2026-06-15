-- Créer table vendor_profiles pour les boutiques
CREATE TABLE IF NOT EXISTS public.vendor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  shop_description TEXT,
  shop_banner_url TEXT,
  total_sales INTEGER DEFAULT 0,
  average_rating NUMERIC DEFAULT 0.0,
  follower_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index pour recherche rapide
CREATE INDEX idx_vendor_profiles_user_id ON public.vendor_profiles(user_id);

-- Enable RLS
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;

-- Policies pour vendor_profiles
CREATE POLICY "Vendors can manage their own profile"
ON public.vendor_profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view vendor profiles"
ON public.vendor_profiles
FOR SELECT
USING (true);

-- Créer table marketplace_share_analytics
CREATE TABLE IF NOT EXISTS public.marketplace_share_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL,
  share_type TEXT NOT NULL,
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0
);

-- Index pour analytics
CREATE INDEX idx_share_analytics_vendor ON public.marketplace_share_analytics(vendor_id);
CREATE INDEX idx_share_analytics_product ON public.marketplace_share_analytics(product_id);
CREATE INDEX idx_share_analytics_date ON public.marketplace_share_analytics(shared_at);

-- Enable RLS
ALTER TABLE public.marketplace_share_analytics ENABLE ROW LEVEL SECURITY;

-- Policies pour analytics
CREATE POLICY "Vendors can view their own analytics"
ON public.marketplace_share_analytics
FOR SELECT
USING (auth.uid() = vendor_id);

CREATE POLICY "Anyone can insert share analytics"
ON public.marketplace_share_analytics
FOR INSERT
WITH CHECK (true);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_vendor_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour vendor_profiles
CREATE TRIGGER update_vendor_profile_timestamp
  BEFORE UPDATE ON public.vendor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vendor_profile_updated_at();