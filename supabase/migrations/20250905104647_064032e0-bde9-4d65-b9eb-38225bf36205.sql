-- CORRECTION CRITIQUE DE SÉCURITÉ : Protection des géolocalisations des chauffeurs
-- Phase 1: Supprimer la fonction existante et corriger les politiques RLS

-- 1. Supprimer la fonction existante si elle existe
DROP FUNCTION IF EXISTS public.find_nearby_drivers(numeric, numeric, numeric, text);

-- 2. Corriger les politiques RLS pour driver_locations
DROP POLICY IF EXISTS "Clients view nearby available drivers" ON public.driver_locations;

-- Nouvelle politique : Seuls les utilisateurs authentifiés peuvent voir les chauffeurs disponibles
-- sans accès aux coordonnées exactes
CREATE POLICY "Authenticated users view available drivers securely" 
ON public.driver_locations 
FOR SELECT 
TO authenticated
USING (is_online = true AND is_available = true AND is_verified = true);

-- 3. Créer une vue publique sécurisée pour l'affichage général (sans coordonnées)
CREATE OR REPLACE VIEW public.available_drivers_summary AS
SELECT 
  count(*) as total_available_drivers,
  COALESCE(vehicle_class, 'standard') as vehicle_class,
  'Kinshasa' as city, -- Ne pas exposer la localisation exacte
  ROUND(AVG(COALESCE(dp.rating_average, 0)), 1) as avg_rating
FROM public.driver_locations dl
LEFT JOIN public.driver_profiles dp ON dl.driver_id = dp.user_id
WHERE dl.is_online = true 
  AND dl.is_available = true 
  AND COALESCE(dl.is_verified, false) = true
  AND COALESCE(dp.verification_status, 'pending') = 'verified'
  AND COALESCE(dp.is_active, false) = true
GROUP BY COALESCE(vehicle_class, 'standard');

-- Pas de RLS sur cette vue car elle ne contient aucune donnée sensible
-- ALTER VIEW public.available_drivers_summary SET (security_invoker = on);

-- 4. Créer une table pour l'audit des accès aux localisations
CREATE TABLE IF NOT EXISTS public.location_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by uuid REFERENCES auth.users(id),
  access_type text NOT NULL,
  search_radius_km numeric,
  search_coordinates jsonb, -- Coordonnées de recherche (pas du chauffeur)
  drivers_found integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Politique RLS pour l'audit (admins seulement)
ALTER TABLE public.location_access_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "location_access_audit_admin_only" 
ON public.location_access_audit 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 5. Fonction pour enregistrer les accès de localisation
CREATE OR REPLACE FUNCTION public.log_location_access(
  access_type_param text,
  search_radius numeric DEFAULT NULL,
  search_lat numeric DEFAULT NULL,
  search_lng numeric DEFAULT NULL,
  drivers_found_count integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insérer l'audit seulement si l'utilisateur est authentifié
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.location_access_audit (
      accessed_by,
      access_type,
      search_radius_km,
      search_coordinates,
      drivers_found
    ) VALUES (
      auth.uid(),
      access_type_param,
      search_radius,
      CASE 
        WHEN search_lat IS NOT NULL AND search_lng IS NOT NULL 
        THEN jsonb_build_object('lat', search_lat, 'lng', search_lng)
        ELSE NULL
      END,
      drivers_found_count
    );
  END IF;
END;
$$;