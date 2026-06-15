-- Supprimer la contrainte incorrecte qui bloque les insertions
ALTER TABLE public.user_verification 
DROP CONSTRAINT IF EXISTS check_verification_status;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can upload their own identity documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own identity documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all identity documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own identity documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own identity documents" ON storage.objects;

-- Créer les politiques RLS sur le bucket identity-documents
CREATE POLICY "Users can upload their own identity documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'identity-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own identity documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'identity-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all identity documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'identity-documents' 
  AND is_current_user_admin()
);

CREATE POLICY "Users can update their own identity documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'identity-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own identity documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'identity-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Fonction de diagnostic pour les admins
CREATE OR REPLACE FUNCTION public.debug_user_verification(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Vérifier les permissions admin
  IF NOT is_current_user_admin() AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'user_verification', (
      SELECT row_to_json(uv.*) 
      FROM user_verification uv 
      WHERE user_id = p_user_id
    ),
    'storage_objects', (
      SELECT jsonb_agg(row_to_json(so.*)) 
      FROM storage.objects so 
      WHERE (so.metadata->>'user_id')::uuid = p_user_id 
        AND bucket_id = 'identity-documents'
    ),
    'activity_logs', (
      SELECT jsonb_agg(row_to_json(al.*)) 
      FROM activity_logs al 
      WHERE user_id = p_user_id 
        AND activity_type LIKE '%verification%' 
      ORDER BY created_at DESC 
      LIMIT 10
    )
  ) INTO result;
  
  RETURN result;
END;
$$;