-- ============================================
-- PHASE 1: Extension de la table user_ratings pour Marketplace
-- ============================================

-- Ajouter colonne marketplace_order_id
ALTER TABLE public.user_ratings 
ADD COLUMN IF NOT EXISTS marketplace_order_id UUID REFERENCES marketplace_orders(id) ON DELETE CASCADE;

-- Ajouter contraintes d'unicité pour éviter les doubles notations
ALTER TABLE public.user_ratings 
DROP CONSTRAINT IF EXISTS unique_rater_marketplace_order;

ALTER TABLE public.user_ratings 
ADD CONSTRAINT unique_rater_marketplace_order 
UNIQUE(rater_user_id, marketplace_order_id);

-- Contraintes d'unicité existantes (au cas où)
ALTER TABLE public.user_ratings 
DROP CONSTRAINT IF EXISTS unique_rater_booking;

ALTER TABLE public.user_ratings 
ADD CONSTRAINT unique_rater_booking 
UNIQUE(rater_user_id, booking_id);

ALTER TABLE public.user_ratings 
DROP CONSTRAINT IF EXISTS unique_rater_delivery;

ALTER TABLE public.user_ratings 
ADD CONSTRAINT unique_rater_delivery 
UNIQUE(rater_user_id, delivery_id);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_ratings_marketplace_order 
ON public.user_ratings(marketplace_order_id) 
WHERE marketplace_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ratings_rated_user 
ON public.user_ratings(rated_user_id);

CREATE INDEX IF NOT EXISTS idx_ratings_rater_user 
ON public.user_ratings(rater_user_id);

-- ============================================
-- PHASE 2: Vue pour statistiques de notation
-- ============================================

CREATE OR REPLACE VIEW public.v_user_rating_stats AS
SELECT 
  rated_user_id,
  COUNT(*) as total_ratings,
  ROUND(AVG(rating), 1) as average_rating,
  COUNT(CASE WHEN rating = 5 THEN 1 END) as five_stars,
  COUNT(CASE WHEN rating = 4 THEN 1 END) as four_stars,
  COUNT(CASE WHEN rating = 3 THEN 1 END) as three_stars,
  COUNT(CASE WHEN rating = 2 THEN 1 END) as two_stars,
  COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star,
  MAX(created_at) as last_rating_at,
  COUNT(CASE WHEN comment IS NOT NULL AND LENGTH(comment) > 0 THEN 1 END) as ratings_with_comments
FROM public.user_ratings
GROUP BY rated_user_id;

-- ============================================
-- PHASE 3: Fonction pour mettre à jour la moyenne des chauffeurs
-- ============================================

CREATE OR REPLACE FUNCTION public.update_user_average_rating(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg_rating NUMERIC;
  v_rating_count INTEGER;
BEGIN
  -- Calculer la moyenne et le nombre de notes
  SELECT 
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO v_avg_rating, v_rating_count
  FROM public.user_ratings
  WHERE rated_user_id = p_user_id;

  -- Mettre à jour la table chauffeurs si l'utilisateur est chauffeur
  UPDATE public.chauffeurs
  SET 
    rating_average = v_avg_rating,
    rating_count = v_rating_count,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- On pourrait aussi ajouter des colonnes rating dans clients/partenaires si nécessaire
END;
$$;

-- ============================================
-- PHASE 4: Trigger automatique de mise à jour des moyennes
-- ============================================

CREATE OR REPLACE FUNCTION public.trigger_update_rating_average()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mettre à jour la moyenne de l'utilisateur noté
  PERFORM public.update_user_average_rating(
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.rated_user_id
      ELSE NEW.rated_user_id
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_rating_average_update ON public.user_ratings;

CREATE TRIGGER trigger_rating_average_update
AFTER INSERT OR UPDATE OR DELETE ON public.user_ratings
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_rating_average();

-- ============================================
-- PHASE 5: RLS Policy sécurisée pour user_ratings
-- ============================================

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Clients can rate completed services" ON public.user_ratings;
DROP POLICY IF EXISTS "Users can view ratings" ON public.user_ratings;

-- Policy: Les clients peuvent noter uniquement leurs services complétés
CREATE POLICY "Clients can rate completed services"
ON public.user_ratings FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = rater_user_id AND
  (
    -- Transport complété
    (booking_id IS NOT NULL AND EXISTS(
      SELECT 1 FROM public.transport_bookings 
      WHERE id = booking_id 
        AND user_id = auth.uid() 
        AND status = 'completed'
    )) OR
    -- Livraison complétée
    (delivery_id IS NOT NULL AND EXISTS(
      SELECT 1 FROM public.delivery_orders 
      WHERE id = delivery_id 
        AND user_id = auth.uid() 
        AND status = 'delivered'
    )) OR
    -- Commande marketplace complétée
    (marketplace_order_id IS NOT NULL AND EXISTS(
      SELECT 1 FROM public.marketplace_orders 
      WHERE id = marketplace_order_id 
        AND buyer_id = auth.uid() 
        AND status = 'completed'
    ))
  )
);

-- Policy: Tout le monde peut voir les notes
CREATE POLICY "Users can view ratings"
ON public.user_ratings FOR SELECT
TO authenticated
USING (true);

-- Activer RLS si pas déjà fait
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PHASE 6: Fonction helper pour vérifier si on peut noter
-- ============================================

CREATE OR REPLACE FUNCTION public.can_rate_order(
  p_user_id UUID,
  p_order_id UUID,
  p_order_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_rated BOOLEAN;
  v_order_completed BOOLEAN;
BEGIN
  -- Vérifier si déjà noté
  CASE p_order_type
    WHEN 'transport' THEN
      SELECT EXISTS(
        SELECT 1 FROM public.user_ratings 
        WHERE rater_user_id = p_user_id AND booking_id = p_order_id
      ) INTO v_already_rated;
      
      SELECT EXISTS(
        SELECT 1 FROM public.transport_bookings
        WHERE id = p_order_id AND user_id = p_user_id AND status = 'completed'
      ) INTO v_order_completed;
      
    WHEN 'delivery' THEN
      SELECT EXISTS(
        SELECT 1 FROM public.user_ratings 
        WHERE rater_user_id = p_user_id AND delivery_id = p_order_id
      ) INTO v_already_rated;
      
      SELECT EXISTS(
        SELECT 1 FROM public.delivery_orders
        WHERE id = p_order_id AND user_id = p_user_id AND status = 'delivered'
      ) INTO v_order_completed;
      
    WHEN 'marketplace' THEN
      SELECT EXISTS(
        SELECT 1 FROM public.user_ratings 
        WHERE rater_user_id = p_user_id AND marketplace_order_id = p_order_id
      ) INTO v_already_rated;
      
      SELECT EXISTS(
        SELECT 1 FROM public.marketplace_orders
        WHERE id = p_order_id AND buyer_id = p_user_id AND status = 'completed'
      ) INTO v_order_completed;
      
    ELSE
      RETURN FALSE;
  END CASE;
  
  RETURN (NOT v_already_rated) AND v_order_completed;
END;
$$;

COMMENT ON VIEW public.v_user_rating_stats IS 'Statistiques de notation agrégées par utilisateur';
COMMENT ON FUNCTION public.update_user_average_rating IS 'Met à jour la moyenne de notation d''un utilisateur';
COMMENT ON FUNCTION public.can_rate_order IS 'Vérifie si un utilisateur peut noter une commande';