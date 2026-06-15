-- ==========================================
-- PHASE 1 : Corriger RLS pour restaurant_pos_sessions
-- ==========================================

-- Supprimer la policy générique problématique
DROP POLICY IF EXISTS "Restaurant owners manage their pos sessions" ON public.restaurant_pos_sessions;

-- Policy SELECT : lire ses propres sessions
CREATE POLICY "Restaurant owners view their pos sessions"
ON public.restaurant_pos_sessions
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM restaurant_profiles
    WHERE restaurant_profiles.id = restaurant_pos_sessions.restaurant_id
      AND restaurant_profiles.user_id = auth.uid()
  )
);

-- Policy INSERT : créer des sessions pour son restaurant
CREATE POLICY "Restaurant owners open pos sessions"
ON public.restaurant_pos_sessions
FOR INSERT
TO public
WITH CHECK (
  opened_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM restaurant_profiles
    WHERE restaurant_profiles.id = restaurant_pos_sessions.restaurant_id
      AND restaurant_profiles.user_id = auth.uid()
  )
);

-- Policy UPDATE : fermer/modifier ses propres sessions
CREATE POLICY "Restaurant owners close their pos sessions"
ON public.restaurant_pos_sessions
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM restaurant_profiles
    WHERE restaurant_profiles.id = restaurant_pos_sessions.restaurant_id
      AND restaurant_profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM restaurant_profiles
    WHERE restaurant_profiles.id = restaurant_pos_sessions.restaurant_id
      AND restaurant_profiles.user_id = auth.uid()
  )
);

-- ==========================================
-- PHASE 2 : Créer le bucket Storage pour photos produits
-- ==========================================

-- Créer le bucket public pour les photos de produits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'restaurant_products',
  'restaurant_products',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy : Les restaurants peuvent uploader des photos pour leurs produits
CREATE POLICY "Restaurant owners upload product photos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'restaurant_products'
  AND auth.uid() IN (
    SELECT user_id FROM restaurant_profiles WHERE is_active = true
  )
);

-- Policy : Tout le monde peut voir les photos (bucket public)
CREATE POLICY "Public can view product photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'restaurant_products');

-- Policy : Les restaurants peuvent supprimer leurs propres photos
CREATE POLICY "Restaurant owners delete their product photos"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'restaurant_products'
  AND auth.uid() IN (
    SELECT user_id FROM restaurant_profiles WHERE is_active = true
  )
);