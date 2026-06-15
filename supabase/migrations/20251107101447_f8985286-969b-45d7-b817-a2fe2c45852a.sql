-- ✅ Créer bucket pour documents chauffeurs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-documents',
  'driver-documents',
  false, -- Privé, accessible seulement au chauffeur et admins
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- ✅ Policies pour les documents chauffeurs

-- Chauffeurs peuvent uploader leurs propres documents
CREATE POLICY "Drivers can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'driver-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Chauffeurs peuvent voir leurs propres documents
CREATE POLICY "Drivers can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Chauffeurs peuvent mettre à jour leurs propres documents
CREATE POLICY "Drivers can update their own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'driver-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Chauffeurs peuvent supprimer leurs propres documents
CREATE POLICY "Drivers can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'driver-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins peuvent voir tous les documents
CREATE POLICY "Admins can view all driver documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-documents'
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);