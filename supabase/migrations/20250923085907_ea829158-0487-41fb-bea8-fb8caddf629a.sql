-- PHASE 4: SÉCURITÉ CRITIQUE - Correction des vues Security Definer et fonctions restantes

-- 1. Supprimer toutes les vues problématiques SECURITY DEFINER
DROP VIEW IF EXISTS public.driver_online_status CASCADE;
DROP VIEW IF EXISTS public.driver_service_status CASCADE;

-- 2. Recréer la vue driver_online_status comme table matérialisée sécurisée
CREATE TABLE IF NOT EXISTS public.driver_online_status_table (
    vehicle_class text,
    online_drivers bigint,
    total_drivers bigint,
    last_updated timestamp with time zone DEFAULT now()
);

-- 3. Fonction pour rafraîchir les statistiques des chauffeurs
CREATE OR REPLACE FUNCTION public.refresh_driver_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Vider la table existante
    DELETE FROM public.driver_online_status_table;
    
    -- Insérer les nouvelles données
    INSERT INTO public.driver_online_status_table (vehicle_class, online_drivers, total_drivers, last_updated)
    SELECT 
        COALESCE(dl.vehicle_class, 'standard') as vehicle_class,
        COUNT(CASE WHEN dl.is_online = true AND dl.last_ping > now() - interval '10 minutes' THEN 1 END) as online_drivers,
        COUNT(*) as total_drivers,
        now() as last_updated
    FROM public.driver_locations dl
    JOIN public.chauffeurs c ON dl.driver_id = c.user_id
    WHERE c.is_active = true
    GROUP BY COALESCE(dl.vehicle_class, 'standard');
END;
$$;

-- 4. Créer une vue sécurisée pour driver_online_status
CREATE OR REPLACE VIEW public.driver_online_status AS
SELECT vehicle_class, online_drivers, total_drivers
FROM public.driver_online_status_table;

-- 5. Activer RLS sur la nouvelle table
ALTER TABLE public.driver_online_status_table ENABLE ROW LEVEL SECURITY;

-- 6. Politique pour permettre la lecture publique des statistiques
CREATE POLICY "Public read access to driver status"
ON public.driver_online_status_table
FOR SELECT
USING (true);

-- 7. Politique pour permettre aux admins de modifier
CREATE POLICY "Admin write access to driver status"
ON public.driver_online_status_table
FOR ALL
USING (is_current_user_admin());

-- 8. Supprimer et recréer les fonctions avec search_path sécurisé
-- Fix search_places function
CREATE OR REPLACE FUNCTION public.search_places(
    search_query text, 
    user_country_code text DEFAULT 'CD'::text, 
    user_city text DEFAULT 'Kinshasa'::text, 
    max_results integer DEFAULT 10
)
RETURNS TABLE(
    id uuid, name text, name_fr text, name_local text, place_type text, 
    category text, country_code text, city text, commune text, 
    latitude numeric, longitude numeric, is_popular boolean, 
    search_keywords text[], relevance_score double precision
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.name, p.name_fr, p.name_local, p.place_type, p.category,
    p.country_code, p.city, p.commune, p.latitude, p.longitude,
    p.is_popular, p.search_keywords,
    -- Score de pertinence basé sur plusieurs facteurs
    (
      -- Correspondance exacte du nom (score élevé)
      CASE WHEN lower(p.name) = lower(search_query) THEN 100.0
           WHEN lower(p.name_fr) = lower(search_query) THEN 95.0
           WHEN lower(p.name_local) = lower(search_query) THEN 90.0
           ELSE 0.0 END +
      
      -- Correspondance partielle du nom
      CASE WHEN lower(p.name) LIKE '%' || lower(search_query) || '%' THEN 50.0
           WHEN lower(p.name_fr) LIKE '%' || lower(search_query) || '%' THEN 45.0
           WHEN lower(p.name_local) LIKE '%' || lower(search_query) || '%' THEN 40.0
           ELSE 0.0 END +
      
      -- Correspondance des mots-clés
      CASE WHEN search_query = ANY(p.search_keywords) THEN 80.0
           WHEN lower(search_query) = ANY(ARRAY(SELECT lower(unnest(p.search_keywords)))) THEN 75.0
           ELSE 0.0 END +
      
      -- Bonus pour le pays/ville de l'utilisateur
      CASE WHEN p.country_code = user_country_code THEN 20.0 ELSE 0.0 END +
      CASE WHEN p.city = user_city THEN 15.0 ELSE 0.0 END +
      
      -- Bonus pour les lieux populaires
      CASE WHEN p.is_popular THEN 10.0 ELSE 0.0 END
      
    )::float AS relevance_score
  FROM public.places_database p
  WHERE 
    p.is_active = true
    AND (
      -- Recherche textuelle
      lower(p.name) LIKE '%' || lower(search_query) || '%'
      OR lower(p.name_fr) LIKE '%' || lower(search_query) || '%'
      OR lower(p.name_local) LIKE '%' || lower(search_query) || '%'
      OR lower(p.commune) LIKE '%' || lower(search_query) || '%'
      OR search_query = ANY(p.search_keywords)
      OR lower(search_query) = ANY(ARRAY(SELECT lower(unnest(p.search_keywords))))
      OR p.search_vector @@ plainto_tsquery('french', search_query)
    )
  ORDER BY 
    (CASE WHEN p.country_code = user_country_code THEN 0 ELSE 1 END),
    (CASE WHEN p.city = user_city THEN 0 ELSE 1 END),
    relevance_score DESC,
    p.is_popular DESC,
    p.name ASC
  LIMIT max_results;
END;
$function$;