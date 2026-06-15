-- ========================================
-- MIGRATION: Système Complet d'Avis Clients Location
-- ========================================

-- 1. Créer la table rental_reviews
CREATE TABLE IF NOT EXISTS public.rental_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.rental_bookings(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.rental_vehicles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('client', 'partner')),
  
  -- Ratings détaillés (1-5 étoiles)
  vehicle_rating INTEGER NOT NULL CHECK (vehicle_rating BETWEEN 1 AND 5),
  service_rating INTEGER NOT NULL CHECK (service_rating BETWEEN 1 AND 5),
  cleanliness_rating INTEGER NOT NULL CHECK (cleanliness_rating BETWEEN 1 AND 5),
  
  -- Note globale calculée automatiquement
  overall_rating DECIMAL(3,2) GENERATED ALWAYS AS (
    ROUND((vehicle_rating + service_rating + cleanliness_rating) / 3.0, 2)
  ) STORED,
  
  -- Contenu de l'avis
  comment TEXT,
  photos TEXT[], -- URLs des photos uploadées
  
  -- Modération
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,
  moderation_reason TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte : 1 seul avis par réservation
  CONSTRAINT unique_booking_review UNIQUE(booking_id, reviewer_id)
);

COMMENT ON TABLE public.rental_reviews IS 'Avis clients sur les véhicules de location';
COMMENT ON COLUMN public.rental_reviews.overall_rating IS 'Note globale calculée: moyenne des 3 ratings';
COMMENT ON COLUMN public.rental_reviews.moderation_status IS 'Statut de modération: pending (défaut), approved, rejected';

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_rental_reviews_vehicle ON public.rental_reviews(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_rental_reviews_reviewer ON public.rental_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_rental_reviews_moderation ON public.rental_reviews(moderation_status);
CREATE INDEX IF NOT EXISTS idx_rental_reviews_booking ON public.rental_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_rental_reviews_created ON public.rental_reviews(created_at DESC);

-- 2. Activer RLS
ALTER TABLE public.rental_reviews ENABLE ROW LEVEL SECURITY;

-- 3. Policies RLS
-- Lecture publique des avis approuvés
CREATE POLICY "Anyone can view approved reviews"
ON public.rental_reviews FOR SELECT
USING (moderation_status = 'approved');

-- Utilisateur voit ses propres avis (même non approuvés)
CREATE POLICY "Users can view their own reviews"
ON public.rental_reviews FOR SELECT
USING (reviewer_id = auth.uid());

-- Création : client peut créer un avis pour sa réservation complétée
CREATE POLICY "Clients can create reviews for their completed bookings"
ON public.rental_reviews FOR INSERT
WITH CHECK (
  reviewer_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.rental_bookings rb
    WHERE rb.id = booking_id
    AND rb.user_id = auth.uid()
    AND rb.status = 'completed'
  )
);

-- Mise à jour : utilisateur peut modifier son avis dans les 7 jours
CREATE POLICY "Users can update their own reviews within 7 days"
ON public.rental_reviews FOR UPDATE
USING (
  reviewer_id = auth.uid() 
  AND created_at > NOW() - INTERVAL '7 days'
);

-- Admin complet
CREATE POLICY "Admins full access to rental reviews"
ON public.rental_reviews FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);

-- 4. Créer la vue matérialisée pour les stats de reviews par véhicule
CREATE MATERIALIZED VIEW IF NOT EXISTS public.rental_vehicle_review_stats AS
SELECT 
  rv.id as vehicle_id,
  COUNT(rr.id)::INTEGER as total_reviews,
  COALESCE(ROUND(AVG(rr.overall_rating), 2), 0) as avg_rating,
  COUNT(CASE WHEN rr.vehicle_rating = 5 THEN 1 END)::INTEGER as five_stars,
  COUNT(CASE WHEN rr.vehicle_rating = 4 THEN 1 END)::INTEGER as four_stars,
  COUNT(CASE WHEN rr.vehicle_rating = 3 THEN 1 END)::INTEGER as three_stars,
  COUNT(CASE WHEN rr.vehicle_rating = 2 THEN 1 END)::INTEGER as two_stars,
  COUNT(CASE WHEN rr.vehicle_rating = 1 THEN 1 END)::INTEGER as one_star,
  MAX(rr.created_at) as last_review_at
FROM public.rental_vehicles rv
LEFT JOIN public.rental_reviews rr ON rr.vehicle_id = rv.id 
  AND rr.moderation_status = 'approved'
GROUP BY rv.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_rental_vehicle_review_stats_vehicle 
ON public.rental_vehicle_review_stats(vehicle_id);

COMMENT ON MATERIALIZED VIEW public.rental_vehicle_review_stats IS 'Stats agrégées des avis par véhicule (rafraîchie automatiquement)';

-- 5. Fonction et trigger pour auto-refresh de rental_vehicle_review_stats
CREATE OR REPLACE FUNCTION public.refresh_rental_vehicle_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.rental_vehicle_review_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_refresh_rental_vehicle_review_stats ON public.rental_reviews;
CREATE TRIGGER trigger_refresh_rental_vehicle_review_stats
AFTER INSERT OR UPDATE OR DELETE ON public.rental_reviews
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_rental_vehicle_review_stats();

-- 6. Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_rental_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_rental_reviews_updated_at ON public.rental_reviews;
CREATE TRIGGER trigger_update_rental_reviews_updated_at
BEFORE UPDATE ON public.rental_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_rental_reviews_updated_at();