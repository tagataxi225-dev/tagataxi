-- Ajouter colonne city à chauffeurs (si elle n'existe pas déjà)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chauffeurs' AND column_name = 'city') THEN
    ALTER TABLE chauffeurs ADD COLUMN city TEXT DEFAULT 'Kinshasa';
  END IF;
END $$;

-- Créer bucket driver-documents si n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Drivers can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can delete own documents" ON storage.objects;

-- Politique: les chauffeurs peuvent voir leurs propres documents
CREATE POLICY "Drivers can view own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Politique: les chauffeurs peuvent uploader leurs documents
CREATE POLICY "Drivers can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Politique: les chauffeurs peuvent mettre à jour leurs documents
CREATE POLICY "Drivers can update own documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Politique: les chauffeurs peuvent supprimer leurs documents
CREATE POLICY "Drivers can delete own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);