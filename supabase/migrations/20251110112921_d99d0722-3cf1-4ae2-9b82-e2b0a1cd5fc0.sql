-- ========================================
-- MIGRATION: Mise à Jour partner_rental_stats avec rental_reviews (FIX)
-- ========================================

-- 1. Supprimer les anciens triggers et fonction
DROP TRIGGER IF EXISTS trigger_refresh_partner_stats_on_review ON public.rental_reviews;
DROP TRIGGER IF EXISTS trigger_refresh_partner_stats_on_booking ON public.rental_bookings;
DROP FUNCTION IF EXISTS public.refresh_partner_rental_stats() CASCADE;

-- 2. Supprimer l'ancienne vue
DROP MATERIALIZED VIEW IF EXISTS public.partner_rental_stats CASCADE;

-- 3. Recréer la vue avec les bonnes colonnes depuis rental_reviews
CREATE MATERIALIZED VIEW public.partner_rental_stats AS
SELECT 
  p.id AS partner_id,
  p.user_id,
  COUNT(DISTINCT rv.id)::INTEGER AS total_vehicles,
  COUNT(DISTINCT CASE WHEN rv.is_available = true THEN rv.id END)::INTEGER AS available_vehicles,
  COUNT(DISTINCT rb.id)::INTEGER AS total_bookings,
  COUNT(DISTINCT CASE WHEN rb.status = 'completed' THEN rb.id END)::INTEGER AS completed_bookings,
  
  -- ✅ CORRECTION: Ratings depuis rental_reviews (pas user_ratings)
  COALESCE(ROUND(AVG(rr.overall_rating), 2), 0) AS rating_average,
  COUNT(DISTINCT rr.id)::INTEGER AS rating_count,
  
  COUNT(DISTINCT prf.follower_id)::INTEGER AS followers_count,
  
  -- Revenue total estimé
  COALESCE(SUM(CASE WHEN rb.status = 'completed' THEN rb.total_amount ELSE 0 END), 0) AS total_revenue,
  
  -- Dernière mise à jour
  NOW() as last_updated
FROM public.partenaires p
LEFT JOIN public.rental_vehicles rv ON rv.partner_id = p.id
LEFT JOIN public.rental_bookings rb ON rb.vehicle_id = rv.id
LEFT JOIN public.rental_reviews rr ON rr.vehicle_id = rv.id AND rr.moderation_status = 'approved'
LEFT JOIN public.partner_rental_followers prf ON prf.partner_id = p.id
GROUP BY p.id, p.user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_rental_stats_partner 
ON public.partner_rental_stats(partner_id);

CREATE INDEX IF NOT EXISTS idx_partner_rental_stats_user 
ON public.partner_rental_stats(user_id);

COMMENT ON MATERIALIZED VIEW public.partner_rental_stats IS 'Stats agrégées des partenaires location (avec avis depuis rental_reviews)';

-- 4. Créer la nouvelle fonction pour rafraîchir partner_rental_stats
CREATE OR REPLACE FUNCTION public.refresh_partner_rental_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.partner_rental_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Créer les triggers pour auto-refresh
CREATE TRIGGER trigger_refresh_partner_stats_on_review
AFTER INSERT OR UPDATE OR DELETE ON public.rental_reviews
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_partner_rental_stats();

CREATE TRIGGER trigger_refresh_partner_stats_on_booking
AFTER INSERT OR UPDATE OR DELETE ON public.rental_bookings
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_partner_rental_stats();

-- 6. Refresh initial des vues matérialisées
REFRESH MATERIALIZED VIEW CONCURRENTLY public.rental_vehicle_review_stats;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.partner_rental_stats;