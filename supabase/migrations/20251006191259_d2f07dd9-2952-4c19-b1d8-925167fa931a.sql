-- Corriger le bug dans diagnose_seller_status qui référence une colonne inexistante
CREATE OR REPLACE FUNCTION public.diagnose_seller_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  user_verification_record RECORD;
  seller_profile_record RECORD;
BEGIN
  -- Récupérer les informations de vérification
  SELECT * INTO user_verification_record
  FROM public.user_verification
  WHERE user_id = p_user_id;
  
  -- Récupérer le profil vendeur
  SELECT * INTO seller_profile_record
  FROM public.seller_profiles
  WHERE user_id = p_user_id;
  
  -- Construire le diagnostic complet
  result := jsonb_build_object(
    'user_id', p_user_id,
    'verification_exists', user_verification_record.id IS NOT NULL,
    'seller_profile_exists', seller_profile_record.id IS NOT NULL,
    'verification_data', CASE 
      WHEN user_verification_record.id IS NOT NULL THEN
        jsonb_build_object(
          'phone_verified', user_verification_record.phone_verified,
          'identity_verified', user_verification_record.identity_verified,
          'verification_level', user_verification_record.verification_level,
          'verification_status', user_verification_record.verification_status
        )
      ELSE NULL
    END,
    'seller_profile_data', CASE 
      WHEN seller_profile_record.id IS NOT NULL THEN
        jsonb_build_object(
          'verified_seller', seller_profile_record.verified_seller,
          'store_name', seller_profile_record.store_name,
          'store_description', seller_profile_record.store_description
        )
      ELSE NULL
    END,
    'can_sell', CASE
      WHEN seller_profile_record.verified_seller = true THEN true
      WHEN user_verification_record.verification_status = 'approved' THEN true
      WHEN user_verification_record.phone_verified = true 
        AND user_verification_record.verification_level IN ('basic', 'full') THEN true
      ELSE false
    END
  );
  
  RETURN result;
END;
$$;