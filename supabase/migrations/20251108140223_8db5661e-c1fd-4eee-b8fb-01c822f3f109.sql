-- ✅ CORRECTION CRITIQUE: Empêcher un vendeur de se noter lui-même

-- Supprimer l'ancienne policy
DROP POLICY IF EXISTS "Users can rate vendors directly" ON marketplace_ratings;

-- Recréer avec protection ANTI-SELF-RATING
CREATE POLICY "Users can rate vendors directly" ON marketplace_ratings
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = buyer_id 
  AND seller_id IS NOT NULL
  AND auth.uid() != seller_id  -- ✅ NOUVEAU: Empêcher self-rating
  AND (
    -- Permettre notation avec commande
    order_id IS NOT NULL
    OR
    -- Permettre notation directe si pas déjà notée dans 30 jours
    (
      order_id IS NULL 
      AND NOT EXISTS (
        SELECT 1 FROM marketplace_ratings mr2
        WHERE mr2.buyer_id = auth.uid()
        AND mr2.seller_id = marketplace_ratings.seller_id
        AND mr2.order_id IS NULL
        AND mr2.created_at > NOW() - INTERVAL '30 days'
      )
    )
  )
);

COMMENT ON POLICY "Users can rate vendors directly" ON marketplace_ratings IS 
'Permet aux clients de noter les vendeurs directement (sans commande) ou via commande. 
Protection anti-spam (30 jours) et anti-self-rating (buyer != seller).';