-- Fix RLS policy pour permettre aux utilisateurs de créer leur compte loyalty
-- Critical: Cette policy permet l'INSERT automatique lors de la première connexion

CREATE POLICY "Users can create their own loyalty account"
ON public.user_loyalty_points
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

-- Vérifier que les autres policies existent
DO $$ 
BEGIN
  -- Policy pour SELECT (lecture de son propre compte)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_loyalty_points' 
    AND policyname = 'Users can view their own loyalty points'
  ) THEN
    CREATE POLICY "Users can view their own loyalty points"
    ON public.user_loyalty_points
    FOR SELECT
    TO public
    USING (auth.uid() = user_id);
  END IF;

  -- Policy pour UPDATE (mise à jour de son propre compte)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_loyalty_points' 
    AND policyname = 'Users can update their own loyalty points'
  ) THEN
    CREATE POLICY "Users can update their own loyalty points"
    ON public.user_loyalty_points
    FOR UPDATE
    TO public
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;