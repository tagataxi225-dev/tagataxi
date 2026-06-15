-- ========================================
-- PHASE 2: BUCKET STORAGE POUR DOCUMENTS DE VÉRIFICATION
-- ========================================

-- Créer le bucket pour les documents de vérification
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy : Les utilisateurs peuvent uploader leurs propres documents
CREATE POLICY "Users can upload their own verification documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy : Les utilisateurs peuvent voir leurs propres documents
CREATE POLICY "Users can view their own verification documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy : Les utilisateurs peuvent mettre à jour leurs propres documents
CREATE POLICY "Users can update their own verification documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy : Les utilisateurs peuvent supprimer leurs propres documents
CREATE POLICY "Users can delete their own verification documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy : Les admins peuvent voir tous les documents
CREATE POLICY "Admins can view all verification documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND is_current_user_admin()
);

-- Ajouter colonne identity_document_url si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_verification' 
    AND column_name = 'identity_document_url'
  ) THEN
    ALTER TABLE public.user_verification 
    ADD COLUMN identity_document_url text;
  END IF;
END $$;