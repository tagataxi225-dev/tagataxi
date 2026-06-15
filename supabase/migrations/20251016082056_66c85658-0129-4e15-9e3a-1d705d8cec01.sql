-- PHASE 2.2 : Table de cache pour geocoding
CREATE TABLE IF NOT EXISTS geocode_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  city TEXT,
  country_code TEXT DEFAULT 'CD',
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  formatted_address TEXT NOT NULL,
  place_id TEXT,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_geocode_cache_key ON geocode_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_geocode_cache_cached_at ON geocode_cache(cached_at);

-- RLS pour admins uniquement
ALTER TABLE geocode_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY geocode_cache_admin_all
ON geocode_cache
FOR ALL
USING (is_current_user_admin());