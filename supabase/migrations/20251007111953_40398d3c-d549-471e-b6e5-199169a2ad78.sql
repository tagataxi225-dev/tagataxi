-- ============================================
-- STORAGE BUCKET POUR DOCUMENTS VENDEUR
-- ============================================

-- Créer le bucket pour les documents vendeur
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-documents', 'vendor-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policy pour upload (utilisateurs authentifiés uniquement)
CREATE POLICY "Users can upload their own vendor documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vendor-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour lecture (vendeur et admins)
CREATE POLICY "Users can view their own vendor documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vendor-documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    public.is_current_user_admin()
  )
);

-- Policy pour suppression (vendeur seulement)
CREATE POLICY "Users can delete their own vendor documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vendor-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);