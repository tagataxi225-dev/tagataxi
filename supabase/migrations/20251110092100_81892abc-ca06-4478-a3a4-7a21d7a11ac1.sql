-- ============================================================================
-- CORRECTION RLS: Permettre la lecture des catégories de location
-- Date: 2025-11-10
-- Objectif: Débloquer la sélection de catégories pour les partenaires
-- ============================================================================

-- Nettoyer les anciennes policies si elles existent
DROP POLICY IF EXISTS "rental_categories_public_read" ON public.rental_vehicle_categories;

-- Policy permettant à TOUS les utilisateurs authentifiés de lire les catégories actives
CREATE POLICY "rental_categories_public_read"
ON public.rental_vehicle_categories
FOR SELECT
TO authenticated
USING (is_active = true);

-- ============================================================================
-- NETTOYAGE ARCHITECTURE: Supprimer table non utilisée
-- ============================================================================

-- Supprimer la table partner_rental_vehicle_categories (non utilisée et source de confusion)
DROP TABLE IF EXISTS public.partner_rental_vehicle_categories CASCADE;

-- ============================================================================
-- VÉRIFICATIONS
-- ============================================================================

-- Vérifier que la policy a été créée
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'rental_vehicle_categories' 
    AND policyname = 'rental_categories_public_read'
  ) THEN
    RAISE NOTICE '✅ Policy SELECT publique créée avec succès';
  ELSE
    RAISE EXCEPTION '❌ Échec création policy SELECT';
  END IF;
END $$;

-- Vérifier que la table partner_rental_vehicle_categories a été supprimée
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'partner_rental_vehicle_categories'
  ) THEN
    RAISE NOTICE '✅ Table partner_rental_vehicle_categories supprimée avec succès';
  ELSE
    RAISE WARNING '⚠️ La table partner_rental_vehicle_categories existe encore';
  END IF;
END $$;