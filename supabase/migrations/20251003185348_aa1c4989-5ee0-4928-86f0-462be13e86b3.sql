-- Créer le bucket pour les documents d'identité
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'identity-documents',
  'identity-documents',
  false, -- Bucket privé pour sécurité
  10485760, -- 10MB max
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy : Permettre aux utilisateurs d'uploader leurs propres documents
CREATE POLICY "Users can upload their own identity documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'identity-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy : Permettre aux utilisateurs de voir leurs propres documents
CREATE POLICY "Users can view their own identity documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'identity-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy : Permettre aux utilisateurs de mettre à jour leurs propres documents
CREATE POLICY "Users can update their own identity documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'identity-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy : Permettre aux utilisateurs de supprimer leurs propres documents
CREATE POLICY "Users can delete their own identity documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'identity-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy : Permettre aux admins de voir tous les documents d'identité
CREATE POLICY "Admins can view all identity documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'identity-documents' AND
  is_current_user_admin()
);

-- Créer un edge function pour générer des URLs signées (pour accès admin sécurisé)
CREATE OR REPLACE FUNCTION public.get_identity_document_url(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_document_url text;
BEGIN
  -- Vérifier que l'utilisateur est admin ou accède à son propre document
  IF NOT (is_current_user_admin() OR auth.uid() = p_user_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Récupérer l'URL du document
  SELECT identity_document_url INTO v_document_url
  FROM public.user_verification
  WHERE user_id = p_user_id;

  RETURN v_document_url;
END;
$$;