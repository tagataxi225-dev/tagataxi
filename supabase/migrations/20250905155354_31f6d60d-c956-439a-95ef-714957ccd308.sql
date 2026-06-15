-- Corriger la vue avec SECURITY DEFINER et finaliser la sécurisation
-- Supprimer la vue SECURITY DEFINER et la remplacer par une vue normale

DROP VIEW IF EXISTS public.driver_availability_summary;

-- Créer une vue normale (sans SECURITY DEFINER) pour les statistiques publiques
CREATE VIEW public.driver_availability_summary AS
SELECT 
  vehicle_class,
  COUNT(*) FILTER (WHERE is_online = true AND is_available = true) as available_count,
  COUNT(*) FILTER (WHERE is_online = true) as online_count,
  -- Pas de coordonnées exactes, juste des statistiques par zone générale de Kinshasa
  CASE 
    WHEN latitude BETWEEN -4.4 AND -4.2 AND longitude BETWEEN 15.2 AND 15.4 THEN 'centre'
    WHEN latitude BETWEEN -4.5 AND -4.3 AND longitude BETWEEN 15.1 AND 15.3 THEN 'ouest'
    WHEN latitude BETWEEN -4.3 AND -4.1 AND longitude BETWEEN 15.3 AND 15.5 THEN 'est'
    ELSE 'autre'
  END as zone_generale,
  AVG(CASE WHEN is_online = true THEN 1 ELSE 0 END) as availability_rate
FROM public.driver_locations dl
WHERE EXISTS (
  SELECT 1 FROM public.driver_profiles dp
  WHERE dp.user_id = dl.driver_id 
    AND dp.verification_status = 'verified' 
    AND dp.is_active = true
)
GROUP BY vehicle_class, zone_generale;

-- Donner accès en lecture à cette vue pour les utilisateurs authentifiés
GRANT SELECT ON public.driver_availability_summary TO authenticated;