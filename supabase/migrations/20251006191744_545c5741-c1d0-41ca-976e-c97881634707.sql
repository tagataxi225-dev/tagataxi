-- Corriger le trigger sync_seller_profile_on_approval
CREATE OR REPLACE FUNCTION public.sync_seller_profile_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_client_name TEXT;
BEGIN
  -- Ne rien faire si ce n'est pas une approbation
  IF NEW.verification_status != 'approved' OR OLD.verification_status = 'approved' THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer le nom du client
  SELECT display_name INTO v_client_name
  FROM public.clients
  WHERE user_id = NEW.user_id;
  
  -- Créer ou mettre à jour le profil vendeur avec les VRAIES colonnes
  INSERT INTO public.seller_profiles (
    user_id,
    display_name,
    seller_badge_level,
    verified_seller,
    created_at,
    updated_at
  ) VALUES (
    NEW.user_id,
    v_client_name,
    'verified',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    verified_seller = true,
    seller_badge_level = 'verified',
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;