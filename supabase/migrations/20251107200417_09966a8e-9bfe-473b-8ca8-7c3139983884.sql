-- ============================================
-- RLS POLICIES pour bucket restaurant-images
-- ============================================

-- 1️⃣ POLICY INSERT : Permettre aux restaurants d'uploader leurs images
CREATE POLICY "Restaurants can upload their images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'restaurant-images' 
  AND auth.uid() IN (
    SELECT user_id 
    FROM restaurant_profiles 
    WHERE is_active = true
  )
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2️⃣ POLICY UPDATE : Permettre aux restaurants de modifier leurs images
CREATE POLICY "Restaurants can update their images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'restaurant-images'
  AND auth.uid() IN (
    SELECT user_id 
    FROM restaurant_profiles 
    WHERE is_active = true
  )
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'restaurant-images'
  AND auth.uid() IN (
    SELECT user_id 
    FROM restaurant_profiles 
    WHERE is_active = true
  )
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3️⃣ POLICY DELETE : Permettre aux restaurants de supprimer leurs images
CREATE POLICY "Restaurants can delete their images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'restaurant-images'
  AND auth.uid() IN (
    SELECT user_id 
    FROM restaurant_profiles 
    WHERE is_active = true
  )
  AND (storage.foldername(name))[1] = auth.uid()::text
);