-- Ajouter la colonne usage_count à saved_addresses pour suivre l'utilisation
ALTER TABLE public.saved_addresses 
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Ajouter la colonne last_used_at pour suivre la dernière utilisation
ALTER TABLE public.saved_addresses 
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Créer une fonction pour incrémenter l'usage d'une adresse
CREATE OR REPLACE FUNCTION public.increment_address_usage(address_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.saved_addresses 
  SET 
    usage_count = COALESCE(usage_count, 0) + 1,
    last_used_at = now(),
    updated_at = now()
  WHERE id = address_id 
    AND user_id = auth.uid();
END;
$$;

-- Créer un index pour améliorer les performances de tri par usage
CREATE INDEX IF NOT EXISTS idx_saved_addresses_usage 
ON public.saved_addresses(user_id, usage_count DESC, last_used_at DESC);

-- Mettre à jour la policy RLS pour permettre l'exécution de la fonction
CREATE POLICY "Users can update usage of their own addresses"
ON public.saved_addresses
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Commenter pour documenter les nouvelles colonnes
COMMENT ON COLUMN public.saved_addresses.usage_count IS 'Nombre de fois que l''adresse a été utilisée';
COMMENT ON COLUMN public.saved_addresses.last_used_at IS 'Dernière fois que l''adresse a été utilisée';
COMMENT ON FUNCTION public.increment_address_usage(UUID) IS 'Incrémente le compteur d''usage d''une adresse sauvegardée';