-- ✅ Policy INSERT pour marketplace-products storage
CREATE POLICY "Users can upload to own folder in marketplace-products"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'marketplace-products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ✅ Policy SELECT pour lecture publique marketplace-products
CREATE POLICY "Public read access to marketplace-products"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'marketplace-products');