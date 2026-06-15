-- ============================================================================
-- FIX: Vendor Rating Duplicate Check - Self-Reference Bug
-- ============================================================================
-- PROBLÈME IDENTIFIÉ : La policy "Users can rate vendors directly" contenait
-- une comparaison self-reference (mr2.seller_id = mr2.seller_id) au lieu de
-- comparer avec la table parente (mr2.seller_id = marketplace_ratings.seller_id)
-- Cette erreur rendait la vérification de doublons inefficace.
-- ============================================================================

-- Supprimer l'ancienne policy défectueuse
DROP POLICY IF EXISTS "Users can rate vendors directly" ON marketplace_ratings;

-- Recréer avec la logique CORRECTE
CREATE POLICY "Users can rate vendors directly" ON marketplace_ratings
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = buyer_id 
  AND seller_id IS NOT NULL
  AND (
    -- Permettre notation avec commande
    order_id IS NOT NULL
    OR
    -- Permettre notation directe si pas déjà notée dans les 30 derniers jours
    (
      order_id IS NULL 
      AND NOT EXISTS (
        SELECT 1 FROM marketplace_ratings mr2
        WHERE mr2.buyer_id = auth.uid()
        AND mr2.seller_id = marketplace_ratings.seller_id  -- ✅ CORRECTION: comparaison avec table parente
        AND mr2.order_id IS NULL
        AND mr2.created_at > NOW() - INTERVAL '30 days'
      )
    )
  )
);

-- Vérifier que la policy est bien créée
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'marketplace_ratings' 
    AND policyname = 'Users can rate vendors directly'
  ) THEN
    RAISE NOTICE '✅ Policy "Users can rate vendors directly" corrigée avec succès';
  ELSE
    RAISE EXCEPTION '❌ Erreur: La policy n''a pas été créée correctement';
  END IF;
END $$;