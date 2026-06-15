-- Créer le bucket pour les images de restaurants
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-images', 'restaurant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy pour permettre aux restaurants d'uploader leurs images
CREATE POLICY "Restaurants can upload their own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'restaurant-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy pour permettre aux restaurants de mettre à jour leurs images
CREATE POLICY "Restaurants can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'restaurant-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy pour permettre à tout le monde de voir les images
CREATE POLICY "Anyone can view restaurant images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'restaurant-images');