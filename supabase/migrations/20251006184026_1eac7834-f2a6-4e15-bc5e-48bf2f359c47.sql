-- ============================================
-- PHASE 1 & 3: Déblocage vérification vendeur
-- ============================================

-- Fonction pour approuver un client pour la vente
CREATE OR REPLACE FUNCTION public.approve_client_for_selling(
  p_user_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_email TEXT;
  v_client_name TEXT;
  v_seller_profile_id UUID;
BEGIN
  -- Vérifier que l'exécuteur est admin
  IF NOT is_current_user_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission refusée');
  END IF;

  -- Récupérer les infos du client
  SELECT email, display_name INTO v_client_email, v_client_name
  FROM public.clients
  WHERE user_id = p_user_id;

  IF v_client_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Client non trouvé');
  END IF;

  -- Mettre à jour le statut de vérification
  UPDATE public.user_verification
  SET 
    verification_status = 'approved',
    verification_level = CASE 
      WHEN verification_level = 'none' THEN 'basic'
      ELSE verification_level
    END,
    verified_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Créer ou mettre à jour le profil vendeur
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
    updated_at = NOW()
  RETURNING id INTO v_seller_profile_id;

  -- Logger l'action dans activity_logs
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    p_user_id,
    'seller_verification_approved',
    'Compte vendeur approuvé par admin',
    jsonb_build_object(
      'admin_id', auth.uid(),
      'admin_notes', p_admin_notes,
      'seller_profile_id', v_seller_profile_id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'seller_profile_id', v_seller_profile_id,
    'message', 'Client approuvé comme vendeur'
  );
END;
$$;

-- Fonction pour rejeter une vérification
CREATE OR REPLACE FUNCTION public.reject_client_verification(
  p_user_id UUID,
  p_rejection_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'exécuteur est admin
  IF NOT is_current_user_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission refusée');
  END IF;

  -- Mettre à jour le statut de vérification
  UPDATE public.user_verification
  SET 
    verification_status = 'rejected',
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Logger l'action
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    p_user_id,
    'seller_verification_rejected',
    'Vérification vendeur rejetée',
    jsonb_build_object(
      'admin_id', auth.uid(),
      'rejection_reason', p_rejection_reason
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Vérification rejetée'
  );
END;
$$;

-- Fonction pour mettre à jour le niveau de vérification
CREATE OR REPLACE FUNCTION public.update_verification_level(
  p_user_id UUID,
  p_new_level TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'exécuteur est admin
  IF NOT is_current_user_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission refusée');
  END IF;

  -- Valider le niveau
  IF p_new_level NOT IN ('none', 'basic', 'full') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Niveau invalide');
  END IF;

  -- Mettre à jour le niveau
  UPDATE public.user_verification
  SET 
    verification_level = p_new_level,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Logger l'action
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    p_user_id,
    'verification_level_updated',
    format('Niveau de vérification changé vers %s', p_new_level),
    jsonb_build_object(
      'admin_id', auth.uid(),
      'new_level', p_new_level,
      'admin_notes', p_admin_notes
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_level', p_new_level
  );
END;
$$;

-- Index pour améliorer les performances des requêtes admin
CREATE INDEX IF NOT EXISTS idx_user_verification_status 
ON public.user_verification(verification_status);

CREATE INDEX IF NOT EXISTS idx_user_verification_level 
ON public.user_verification(verification_level);

-- Trigger pour synchroniser seller_profiles lors de l'approbation
CREATE OR REPLACE FUNCTION public.sync_seller_profile_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_name TEXT;
BEGIN
  -- Si passé à approved et n'était pas approved avant
  IF NEW.verification_status = 'approved' AND 
     (OLD.verification_status IS NULL OR OLD.verification_status != 'approved') THEN
    
    -- Récupérer le nom du client
    SELECT display_name INTO v_client_name
    FROM public.clients
    WHERE user_id = NEW.user_id;

    -- Créer ou activer le profil vendeur
    INSERT INTO public.seller_profiles (
      user_id,
      display_name,
      badge_level,
      is_verified,
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
      is_verified = true,
      badge_level = 'verified',
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_sync_seller_profile ON public.user_verification;
CREATE TRIGGER trigger_sync_seller_profile
  AFTER UPDATE ON public.user_verification
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_seller_profile_on_approval();