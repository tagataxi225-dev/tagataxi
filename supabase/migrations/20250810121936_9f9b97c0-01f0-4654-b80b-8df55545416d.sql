-- Créer la table de base de données géographique africaine étendue
CREATE TABLE public.places_database (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_local TEXT,
  place_type TEXT NOT NULL DEFAULT 'locality',
  category TEXT NOT NULL DEFAULT 'general',
  country_code TEXT NOT NULL DEFAULT 'CD',
  city TEXT NOT NULL DEFAULT 'Kinshasa',
  commune TEXT,
  district TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  accuracy INTEGER DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  search_keywords TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les recherches par nom
CREATE INDEX idx_places_search ON public.places_database 
USING GIN(to_tsvector('french', name || ' ' || name_fr || ' ' || COALESCE(name_local, '')));

-- Index pour les pays et villes
CREATE INDEX idx_places_country_city ON public.places_database(country_code, city);

-- Index pour les recherches de mots-clés
CREATE INDEX idx_places_keywords ON public.places_database USING GIN(search_keywords);

-- Index simple pour localisation géographique
CREATE INDEX idx_places_location ON public.places_database(latitude, longitude);

-- RLS policy pour la lecture publique
ALTER TABLE public.places_database ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read places database" ON public.places_database
  FOR SELECT USING (is_active = true);

-- Trigger pour updated_at
CREATE TRIGGER update_places_database_updated_at
  BEFORE UPDATE ON public.places_database
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour calculer la distance entre deux points
CREATE OR REPLACE FUNCTION public.calculate_distance_km(
  lat1 numeric, lng1 numeric,
  lat2 numeric, lng2 numeric
) RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  earth_radius CONSTANT numeric := 6371; -- Earth radius in km
  dlat numeric;
  dlng numeric;
  a numeric;
  c numeric;
BEGIN
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlng/2) * sin(dlng/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius * c;
END;
$$;