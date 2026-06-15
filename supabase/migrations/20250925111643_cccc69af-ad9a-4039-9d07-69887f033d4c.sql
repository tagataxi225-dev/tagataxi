-- Tables pour système de lieux personnalisés et cache intelligent
CREATE TABLE IF NOT EXISTS public.user_saved_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  place_type TEXT NOT NULL DEFAULT 'custom', -- 'home', 'work', 'favorite', 'custom'
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.user_recent_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  search_query TEXT NOT NULL,
  result_address TEXT,
  result_latitude NUMERIC,
  result_longitude NUMERIC,
  selected BOOLEAN DEFAULT FALSE,
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_location_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  preferred_city TEXT DEFAULT 'Kinshasa',
  preferred_language TEXT DEFAULT 'fr',
  auto_save_favorites BOOLEAN DEFAULT TRUE,
  location_sharing BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.location_search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_key TEXT NOT NULL UNIQUE, -- Hash de la requête + region
  query TEXT NOT NULL,
  region TEXT DEFAULT 'cd',
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  result_count INTEGER DEFAULT 0,
  provider TEXT DEFAULT 'google',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS pour toutes les tables
ALTER TABLE public.user_saved_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_recent_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_location_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_search_cache ENABLE ROW LEVEL SECURITY;

-- Policies pour user_saved_places
CREATE POLICY "Users can manage their own saved places" ON public.user_saved_places
  FOR ALL USING (auth.uid() = user_id);

-- Policies pour user_recent_searches  
CREATE POLICY "Users can manage their own recent searches" ON public.user_recent_searches
  FOR ALL USING (auth.uid() = user_id);

-- Policies pour user_location_preferences
CREATE POLICY "Users can manage their own location preferences" ON public.user_location_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Policies pour location_search_cache (lecture publique, écriture admin)
CREATE POLICY "Public read access to location cache" ON public.location_search_cache
  FOR SELECT USING (expires_at > NOW());

CREATE POLICY "Admin write access to location cache" ON public.location_search_cache
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_saved_places_user_id ON public.user_saved_places(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_places_type ON public.user_saved_places(place_type);
CREATE INDEX IF NOT EXISTS idx_user_saved_places_usage ON public.user_saved_places(usage_count DESC, last_used_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_recent_searches_user_id ON public.user_recent_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recent_searches_time ON public.user_recent_searches(last_searched_at DESC);

CREATE INDEX IF NOT EXISTS idx_location_cache_key ON public.location_search_cache(search_key);
CREATE INDEX IF NOT EXISTS idx_location_cache_expires ON public.location_search_cache(expires_at);

-- Fonction pour nettoyer le cache expiré
CREATE OR REPLACE FUNCTION cleanup_expired_location_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.location_search_cache 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour update automatique
CREATE OR REPLACE FUNCTION update_user_saved_places_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_saved_places_updated_at
  BEFORE UPDATE ON public.user_saved_places
  FOR EACH ROW
  EXECUTE FUNCTION update_user_saved_places_timestamp();