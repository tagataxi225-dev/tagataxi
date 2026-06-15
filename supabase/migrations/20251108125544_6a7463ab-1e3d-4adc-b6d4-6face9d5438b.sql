-- ============================================================================
-- MIGRATION: Système de notation vendeur direct
-- Permet aux utilisateurs de noter un vendeur sans commander de produit
-- ============================================================================

-- ✅ PHASE 1: Modifier RLS policy pour permettre notation directe vendeur
-- Supprimer l'ancienne policy si elle existe
DROP POLICY IF EXISTS "Users can rate vendors directly" ON marketplace_ratings;

-- Créer policy pour permettre insertion de notation vendeur directe
CREATE POLICY "Users can rate vendors directly"
ON marketplace_ratings 
FOR INSERT
TO authenticated
WITH CHECK (
  -- L'utilisateur doit être authentifié et être le buyer
  auth.uid() = buyer_id 
  AND seller_id IS NOT NULL
  -- Permettre order_id NULL pour notation directe
  AND (
    order_id IS NOT NULL -- Notation après commande
    OR 
    ( -- OU notation directe sans commande
      order_id IS NULL 
      AND NOT EXISTS (
        -- Mais vérifier qu'il n'a pas déjà noté ce vendeur récemment (30 jours)
        SELECT 1 FROM marketplace_ratings
        WHERE buyer_id = auth.uid() 
        AND seller_id = marketplace_ratings.seller_id
        AND order_id IS NULL
        AND created_at > NOW() - INTERVAL '30 days'
      )
    )
  )
);

-- ✅ PHASE 2: Créer fonction pour mettre à jour les stats de notation vendeur
CREATE OR REPLACE FUNCTION update_vendor_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer la moyenne des notes pour ce vendeur
  UPDATE vendor_profiles
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM marketplace_ratings
      WHERE seller_id = NEW.seller_id
    ),
    updated_at = NOW()
  WHERE user_id = NEW.seller_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ PHASE 3: Créer trigger pour mettre à jour automatiquement
DROP TRIGGER IF EXISTS trigger_update_vendor_rating_stats ON marketplace_ratings;

CREATE TRIGGER trigger_update_vendor_rating_stats
AFTER INSERT OR UPDATE OR DELETE ON marketplace_ratings
FOR EACH ROW
EXECUTE FUNCTION update_vendor_rating_stats();

-- ✅ PHASE 4: Mettre à jour les notes existantes (recalcul initial)
UPDATE vendor_profiles vp
SET 
  average_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM marketplace_ratings mr
    WHERE mr.seller_id = vp.user_id
  ),
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM marketplace_ratings
  WHERE seller_id = vp.user_id
);

-- ✅ PHASE 5: Ajouter index pour performance
CREATE INDEX IF NOT EXISTS idx_marketplace_ratings_vendor_direct 
ON marketplace_ratings(seller_id, buyer_id, created_at) 
WHERE order_id IS NULL;

-- ============================================================================
-- RÉSULTAT ATTENDU:
-- 1. Les utilisateurs peuvent noter un vendeur directement (sans commande)
-- 2. Limite: 1 notation directe par vendeur tous les 30 jours
-- 3. Le vendor_profiles.average_rating se met à jour automatiquement
-- 4. Les notations après commande continuent de fonctionner normalement
-- ============================================================================