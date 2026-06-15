-- Ajouter politique DELETE sur restaurant-images pour permettre le remplacement des images
CREATE POLICY "Restaurants can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'restaurant-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);