-- Créer les fonctions RPC manquantes pour le service de partage de trajet

-- Fonction pour créer un lien de partage de trajet
CREATE OR REPLACE FUNCTION public.create_trip_share_link(
  p_share_id TEXT,
  p_trip_id UUID,
  p_encrypted_data TEXT,
  p_expires_at TIMESTAMP WITH TIME ZONE
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_link_id UUID;
BEGIN
  INSERT INTO public.trip_share_links (
    share_id, trip_id, encrypted_data, expires_at, is_active, created_by
  ) VALUES (
    p_share_id, p_trip_id, p_encrypted_data, p_expires_at, true, auth.uid()
  )
  RETURNING id INTO new_link_id;
  
  RETURN new_link_id;
END;
$$;

-- Fonction pour récupérer les données d'un trajet partagé
CREATE OR REPLACE FUNCTION public.get_trip_share_data(
  p_share_id TEXT
) RETURNS TABLE(
  id UUID,
  share_id TEXT,
  trip_id UUID,
  encrypted_data TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tsl.id,
    tsl.share_id,
    tsl.trip_id,
    tsl.encrypted_data,
    tsl.expires_at,
    tsl.is_active,
    tsl.created_at
  FROM public.trip_share_links tsl
  WHERE tsl.share_id = p_share_id
    AND tsl.is_active = true
    AND tsl.expires_at > now()
  LIMIT 1;
END;
$$;

-- Fonction pour désactiver un lien de partage
CREATE OR REPLACE FUNCTION public.deactivate_trip_share_link(
  p_share_id TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.trip_share_links
  SET is_active = false, updated_at = now()
  WHERE share_id = p_share_id;
  
  RETURN FOUND;
END;
$$;

-- Fonction pour mettre à jour la position d'un trajet partagé
CREATE OR REPLACE FUNCTION public.update_trip_share_location(
  p_share_id TEXT,
  p_encrypted_data TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.trip_share_links
  SET encrypted_data = p_encrypted_data, updated_at = now()
  WHERE share_id = p_share_id
    AND is_active = true
    AND expires_at > now();
  
  RETURN FOUND;
END;
$$;

-- Fonction pour nettoyer les liens expirés
CREATE OR REPLACE FUNCTION public.cleanup_expired_trip_links()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE public.trip_share_links
  SET is_active = false, updated_at = now()
  WHERE expires_at < now() AND is_active = true;
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  RETURN cleaned_count;
END;
$$;