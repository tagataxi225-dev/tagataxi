-- ========================================
-- CRÉATION BUCKET MARKETPLACE-PRODUCTS
-- ========================================
-- Bucket dédié pour les images de produits marketplace
INSERT INTO storage.buckets (id, name, public) 
VALUES ('marketplace-products', 'marketplace-products', true)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- RLS POLICIES POUR MARKETPLACE-PRODUCTS
-- ========================================

-- Policy : Lecture publique (tous les visiteurs)
CREATE POLICY "Public can view marketplace products" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'marketplace-products');

-- Policy : Upload (utilisateurs authentifiés uniquement)
CREATE POLICY "Authenticated users can upload marketplace products" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'marketplace-products' 
  AND auth.uid() IS NOT NULL
);

-- Policy : Update (propriétaire uniquement)
CREATE POLICY "Users can update their own marketplace products" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'marketplace-products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy : Delete (propriétaire uniquement)
CREATE POLICY "Users can delete their own marketplace products" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'marketplace-products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);