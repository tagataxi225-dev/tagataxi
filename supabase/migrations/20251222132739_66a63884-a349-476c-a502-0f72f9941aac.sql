-- 1. Créer le bucket partner-assets (public, images uniquement)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'partner-assets', 
  'partner-assets', 
  true, 
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 2. Ajouter colonne logo_url à partenaires si elle n'existe pas
ALTER TABLE partenaires ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 3. Policy pour upload (partners peuvent uploader leurs propres assets)
CREATE POLICY "Partners can upload own assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy pour update (partners peuvent modifier leurs propres assets)
CREATE POLICY "Partners can update own assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'partner-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy pour delete (partners peuvent supprimer leurs propres assets)
CREATE POLICY "Partners can delete own assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'partner-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Policy pour lecture publique
CREATE POLICY "Public can view partner assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'partner-assets');