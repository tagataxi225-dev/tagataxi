-- ============================================================================
-- CORRECTION ARCHITECTURE PARTENAIRES - Phase 1 (Corrigée)
-- Supprimer la dépendance à partner_profiles et utiliser uniquement partenaires
-- ============================================================================

-- 1. Ajouter les colonnes manquantes dans partenaires si nécessaire
ALTER TABLE public.partenaires 
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_phone TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Supprimer la table partner_profiles si elle existe
DROP TABLE IF EXISTS public.partner_profiles CASCADE;

-- 3. Créer une view pour compatibilité ascendante
CREATE OR REPLACE VIEW public.partner_profiles AS
SELECT 
  id,
  user_id,
  company_name,
  address as company_address,
  phone_number as company_phone,
  tax_number,
  company_registration_number as license_number,
  verification_status as validation_status,
  verified_by as validated_by,
  verified_at as validated_at,
  admin_comments as rejection_reason,
  is_active,
  created_at,
  updated_at
FROM public.partenaires;

COMMENT ON VIEW partner_profiles IS 
'View pour compatibilité - Redirige vers partenaires (table unique)';

-- 4. RLS POLICY UPDATE POUR ADMINS
DROP POLICY IF EXISTS "admins_update_partenaires" ON public.partenaires;

CREATE POLICY "admins_update_partenaires"
ON public.partenaires
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  )
);

-- 5. Policy permettant aux admins de supprimer les partenaires
DROP POLICY IF EXISTS "admins_delete_partenaires" ON public.partenaires;

CREATE POLICY "admins_delete_partenaires"
ON public.partenaires
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  )
);

-- 6. Vérification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'partenaires' 
    AND policyname = 'admins_update_partenaires'
  ) THEN
    RAISE NOTICE '✅ Policy UPDATE pour admins créée avec succès';
  ELSE
    RAISE EXCEPTION '❌ Échec création policy UPDATE';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'partenaires' 
    AND policyname = 'admins_delete_partenaires'
  ) THEN
    RAISE NOTICE '✅ Policy DELETE pour admins créée avec succès';
  ELSE
    RAISE EXCEPTION '❌ Échec création policy DELETE';
  END IF;
END $$;