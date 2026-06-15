-- Phase 4: Migration pour positions réelles Google Maps
-- Ajouter colonnes pour adresses Google Maps dans driver_locations

-- Ajouter colonnes pour adresses Google Maps réelles
ALTER TABLE public.driver_locations 
ADD COLUMN IF NOT EXISTS google_address TEXT,
ADD COLUMN IF NOT EXISTS google_place_name TEXT,
ADD COLUMN IF NOT EXISTS google_place_id TEXT,
ADD COLUMN IF NOT EXISTS google_geocoded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS geocode_source TEXT DEFAULT 'google';

-- Index pour améliorer les performances des recherches par adresse
CREATE INDEX IF NOT EXISTS idx_driver_locations_google_address 
ON public.driver_locations (google_address);

-- Index pour recherche par place_id Google
CREATE INDEX IF NOT EXISTS idx_driver_locations_google_place_id 
ON public.driver_locations (google_place_id);

-- Fonction pour mettre à jour automatiquement google_geocoded_at
CREATE OR REPLACE FUNCTION public.update_google_geocoded_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'adresse Google change, mettre à jour le timestamp
  IF NEW.google_address IS DISTINCT FROM OLD.google_address THEN
    NEW.google_geocoded_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour mettre à jour automatiquement google_geocoded_at
DROP TRIGGER IF EXISTS trigger_update_google_geocoded_timestamp ON public.driver_locations;
CREATE TRIGGER trigger_update_google_geocoded_timestamp
    BEFORE UPDATE ON public.driver_locations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_google_geocoded_timestamp();

-- Fonction pour nettoyer les anciennes données de géolocalisation
CREATE OR REPLACE FUNCTION public.cleanup_old_geocode_data(days_old INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  -- Nettoyer les données de géocodage anciennes (garder les plus récentes)
  DELETE FROM public.driver_locations 
  WHERE google_geocoded_at < NOW() - (days_old || ' days')::INTERVAL
    AND is_online = false
    AND is_available = false;
    
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Commentaires pour documentation
COMMENT ON COLUMN public.driver_locations.google_address IS 'Adresse Google Maps réelle géocodée automatiquement';
COMMENT ON COLUMN public.driver_locations.google_place_name IS 'Nom du lieu Google Maps si disponible';
COMMENT ON COLUMN public.driver_locations.google_place_id IS 'ID du lieu Google Maps pour référence';
COMMENT ON COLUMN public.driver_locations.google_geocoded_at IS 'Timestamp de la dernière géolocalisation Google';
COMMENT ON COLUMN public.driver_locations.geocode_source IS 'Source du géocodage: google, cache, fallback';