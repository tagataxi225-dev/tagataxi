-- Créer une edge function pour géolocalisation IP fiable
-- Cette fonction remplace les services externes défaillants

-- Ajouter table pour cache géolocalisation IP si pas déjà existante
CREATE TABLE IF NOT EXISTS public.ip_geolocation_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL,
  country_code TEXT,
  country_name TEXT,
  city TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  accuracy INTEGER DEFAULT 10000,
  provider TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_ip_geolocation_cache_ip 
ON public.ip_geolocation_cache(ip_address);

CREATE INDEX IF NOT EXISTS idx_ip_geolocation_cache_expires 
ON public.ip_geolocation_cache(expires_at);

-- Politique RLS
ALTER TABLE public.ip_geolocation_cache ENABLE ROW LEVEL SECURITY;

-- Politique pour lecture publique (géolocalisation IP est publique)
CREATE POLICY "IP geolocation cache is publicly readable" 
ON public.ip_geolocation_cache FOR SELECT 
USING (true);

-- Politique pour insertion par la fonction edge
CREATE POLICY "Edge functions can insert IP geolocation" 
ON public.ip_geolocation_cache FOR INSERT 
WITH CHECK (true);

-- Fonction de nettoyage automatique du cache
CREATE OR REPLACE FUNCTION public.cleanup_ip_geolocation_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les entrées expirées
  DELETE FROM public.ip_geolocation_cache 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$function$;