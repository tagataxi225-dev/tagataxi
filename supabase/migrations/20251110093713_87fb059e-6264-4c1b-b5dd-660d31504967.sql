-- ============================================================================
-- PHASE 1: Configuration Supabase Storage pour images véhicules location
-- ============================================================================

-- Créer le bucket pour les images de véhicules de location (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rental-vehicles',
  'rental-vehicles',
  true,
  5242880, -- 5MB max par image
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- ============================================================================
-- RLS POLICIES pour rental-vehicles bucket
-- ============================================================================

-- Policy 1: Upload pour partenaires vérifiés uniquement
DROP POLICY IF EXISTS "rental_vehicles_upload" ON storage.objects;
CREATE POLICY "rental_vehicles_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'rental-vehicles' AND
  auth.uid() IN (
    SELECT user_id 
    FROM partenaires 
    WHERE verification_status = 'verified'
  )
);

-- Policy 2: Lecture publique des images (pour affichage côté client)
DROP POLICY IF EXISTS "rental_vehicles_public_read" ON storage.objects;
CREATE POLICY "rental_vehicles_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'rental-vehicles');

-- Policy 3: Suppression uniquement par le propriétaire
DROP POLICY IF EXISTS "rental_vehicles_delete_own" ON storage.objects;
CREATE POLICY "rental_vehicles_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'rental-vehicles' AND
  auth.uid() IN (
    SELECT user_id FROM partenaires
  )
);

-- Policy 4: Mise à jour par le propriétaire
DROP POLICY IF EXISTS "rental_vehicles_update_own" ON storage.objects;
CREATE POLICY "rental_vehicles_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'rental-vehicles' AND
  auth.uid() IN (
    SELECT user_id FROM partenaires
  )
);

-- Vérification des policies créées
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE 'rental_vehicles%';
  
  IF policy_count >= 4 THEN
    RAISE NOTICE '✅ Storage bucket rental-vehicles configuré avec % policies RLS', policy_count;
  ELSE
    RAISE EXCEPTION '❌ Échec configuration Storage: seulement % policies créées', policy_count;
  END IF;
END $$;