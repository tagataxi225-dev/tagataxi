-- Ajouter la policy INSERT pour heatmap_clicks
-- Permet aux utilisateurs authentifiés d'insérer des clics

-- Vérifier si la table existe et ajouter la policy
DO $$
BEGIN
  -- Vérifier si la policy existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'heatmap_clicks' 
    AND policyname = 'Authenticated users can insert heatmap clicks'
  ) THEN
    -- Créer la policy INSERT
    CREATE POLICY "Authenticated users can insert heatmap clicks"
    ON public.heatmap_clicks
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
END $$;

-- S'assurer que RLS est activé sur la table
ALTER TABLE IF EXISTS public.heatmap_clicks ENABLE ROW LEVEL SECURITY;

-- Ajouter aussi une policy pour les utilisateurs anonymes si nécessaire
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'heatmap_clicks' 
    AND policyname = 'Anyone can insert heatmap clicks'
  ) THEN
    CREATE POLICY "Anyone can insert heatmap clicks"
    ON public.heatmap_clicks
    FOR INSERT
    TO anon
    WITH CHECK (true);
  END IF;
END $$;