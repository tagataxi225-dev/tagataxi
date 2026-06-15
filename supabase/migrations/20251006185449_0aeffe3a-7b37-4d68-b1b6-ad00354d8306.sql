-- ============================================
-- PHASE 1: Debug et amélioration vérification vendeur
-- ============================================

-- Fonction de debug pour forcer l'activation vendeur (ADMIN ONLY)
CREATE OR REPLACE FUNCTION public.force_activate_seller(
  p_user_id UUID,
  p_admin_notes TEXT DEFAULT 'Activation forcée par admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_client_name TEXT;
  v_verification_exists BOOLEAN;
BEGIN
  -- Vérifier que l'exécuteur est admin
  IF NOT is_current_user_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission refusée');
  END IF;

  -- Récupérer le nom du client
  SELECT display_name INTO v_client_name
  FROM public.clients
  WHERE user_id = p_user_id;

  IF v_client_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Client non trouvé');
  END IF;

  -- Vérifier si user_verification existe
  SELECT EXISTS(
    SELECT 1 FROM public.user_verification WHERE user_id = p_user_id
  ) INTO v_verification_exists;

  -- Créer user_verification si n'existe pas
  IF NOT v_verification_exists THEN
    INSERT INTO public.user_verification (
      user_id,
      phone_verified,
      identity_verified,
      verification_level,
      verification_status,
      verified_at
    ) VALUES (
      p_user_id,
      true,
      true,
      'basic',
      'approved',
      NOW()
    );
  ELSE
    -- Mettre à jour avec force
    UPDATE public.user_verification
    SET 
      verification_status = 'approved',
      verification_level = 'basic',
      phone_verified = true,
      identity_verified = true,
      verified_at = NOW(),
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- Créer/activer le profil vendeur avec force
  INSERT INTO public.seller_profiles (
    user_id,
    display_name,
    badge_level,
    is_verified,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    v_client_name,
    'verified',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    is_verified = true,
    badge_level = 'verified',
    updated_at = NOW();

  -- Logger l'action
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    p_user_id,
    'seller_force_activated',
    'Vendeur activé de force par admin',
    jsonb_build_object(
      'admin_id', auth.uid(),
      'admin_notes', p_admin_notes,
      'forced', true
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Vendeur activé avec succès',
    'user_id', p_user_id,
    'verification_status', 'approved',
    'verification_level', 'basic'
  );
END;
$$;

-- Fonction de diagnostic pour comprendre les blocages
CREATE OR REPLACE FUNCTION public.diagnose_seller_status(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_exists BOOLEAN;
  v_verification_record JSONB;
  v_seller_profile JSONB;
  v_blocking_reasons TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Vérifier que l'exécuteur est admin ou le user lui-même
  IF NOT (is_current_user_admin() OR auth.uid() = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission refusée');
  END IF;

  -- Vérifier si le client existe
  SELECT EXISTS(SELECT 1 FROM public.clients WHERE user_id = p_user_id) 
  INTO v_client_exists;

  IF NOT v_client_exists THEN
    v_blocking_reasons := array_append(v_blocking_reasons, 'Client inexistant');
  END IF;

  -- Récupérer user_verification
  SELECT jsonb_build_object(
    'exists', COUNT(*) > 0,
    'verification_status', MAX(verification_status),
    'verification_level', MAX(verification_level),
    'phone_verified', BOOL_OR(phone_verified),
    'identity_verified', BOOL_OR(identity_verified),
    'verified_at', MAX(verified_at)
  ) INTO v_verification_record
  FROM public.user_verification
  WHERE user_id = p_user_id;

  -- Analyser les raisons de blocage
  IF (v_verification_record->>'verification_status') IS NULL THEN
    v_blocking_reasons := array_append(v_blocking_reasons, 'Aucun enregistrement de vérification');
  ELSIF (v_verification_record->>'verification_status') = 'pending' THEN
    v_blocking_reasons := array_append(v_blocking_reasons, 'Vérification en attente');
  ELSIF (v_verification_record->>'verification_status') = 'rejected' THEN
    v_blocking_reasons := array_append(v_blocking_reasons, 'Vérification rejetée');
  END IF;

  IF NOT COALESCE((v_verification_record->>'phone_verified')::boolean, false) THEN
    v_blocking_reasons := array_append(v_blocking_reasons, 'Téléphone non vérifié');
  END IF;

  IF COALESCE(v_verification_record->>'verification_level', 'none') = 'none' THEN
    v_blocking_reasons := array_append(v_blocking_reasons, 'Niveau de vérification: aucun');
  END IF;

  -- Récupérer seller_profile
  SELECT jsonb_build_object(
    'exists', COUNT(*) > 0,
    'is_verified', BOOL_OR(is_verified),
    'badge_level', MAX(badge_level)
  ) INTO v_seller_profile
  FROM public.seller_profiles
  WHERE user_id = p_user_id;

  IF NOT COALESCE((v_seller_profile->>'exists')::boolean, false) THEN
    v_blocking_reasons := array_append(v_blocking_reasons, 'Profil vendeur inexistant');
  ELSIF NOT COALESCE((v_seller_profile->>'is_verified')::boolean, false) THEN
    v_blocking_reasons := array_append(v_blocking_reasons, 'Profil vendeur non vérifié');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'client_exists', v_client_exists,
    'verification_record', v_verification_record,
    'seller_profile', v_seller_profile,
    'blocking_reasons', v_blocking_reasons,
    'can_sell', array_length(v_blocking_reasons, 1) IS NULL OR array_length(v_blocking_reasons, 1) = 0
  );
END;
$$;