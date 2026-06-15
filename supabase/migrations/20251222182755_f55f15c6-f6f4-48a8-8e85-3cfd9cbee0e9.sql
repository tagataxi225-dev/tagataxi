-- Améliorer la fonction apply_referral_code avec limite de 20 filleuls
CREATE OR REPLACE FUNCTION public.apply_referral_code(
  p_referee_id uuid,
  p_referral_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_referral_count integer;
  v_existing_referral uuid;
  v_referrer_name text;
  v_referee_reward numeric := 500;
  v_referrer_reward numeric := 500;
  v_max_referrals integer := 20;
BEGIN
  -- Log de début
  RAISE NOTICE 'apply_referral_code: Début pour referee_id=%, code=%', p_referee_id, p_referral_code;

  -- Validation du code
  IF p_referral_code IS NULL OR length(trim(p_referral_code)) < 4 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Code de parrainage invalide'
    );
  END IF;

  -- Rechercher le parrain par son code
  SELECT user_id, referral_code INTO v_referrer_id
  FROM public.user_referral_codes
  WHERE referral_code = upper(trim(p_referral_code))
    AND is_active = true;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Code de parrainage introuvable ou inactif'
    );
  END IF;

  -- Vérifier qu'on ne se parraine pas soi-même
  IF v_referrer_id = p_referee_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Vous ne pouvez pas utiliser votre propre code'
    );
  END IF;

  -- NOUVELLE VÉRIFICATION: Limite de 20 filleuls maximum
  SELECT COUNT(*) INTO v_referral_count
  FROM public.referral_system
  WHERE referrer_id = v_referrer_id;

  IF v_referral_count >= v_max_referrals THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Ce parrain a atteint sa limite de 20 amis parrainés',
      'limit_reached', true
    );
  END IF;

  -- Vérifier si l'utilisateur a déjà été parrainé
  SELECT id INTO v_existing_referral
  FROM public.referral_system
  WHERE referee_id = p_referee_id
  LIMIT 1;

  IF v_existing_referral IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Vous avez déjà été parrainé'
    );
  END IF;

  -- Récupérer le nom du parrain pour l'affichage
  SELECT COALESCE(display_name, 'Ami Kwenda') INTO v_referrer_name
  FROM public.clients
  WHERE user_id = v_referrer_id
  LIMIT 1;

  IF v_referrer_name IS NULL THEN
    SELECT COALESCE(display_name, 'Ami Kwenda') INTO v_referrer_name
    FROM public.chauffeurs
    WHERE user_id = v_referrer_id
    LIMIT 1;
  END IF;

  -- Créer l'entrée de parrainage
  INSERT INTO public.referral_system (
    referrer_id,
    referee_id,
    referral_code,
    status,
    referee_reward_amount,
    referrer_reward_amount,
    created_at
  ) VALUES (
    v_referrer_id,
    p_referee_id,
    upper(trim(p_referral_code)),
    'pending',
    v_referee_reward,
    v_referrer_reward,
    now()
  );

  RAISE NOTICE 'apply_referral_code: Succès - Filleul % parrainé par % (code %)', p_referee_id, v_referrer_id, p_referral_code;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Code de parrainage appliqué avec succès !',
    'referrer_name', COALESCE(v_referrer_name, 'Ami Kwenda'),
    'referee_reward', v_referee_reward,
    'referrer_reward', v_referrer_reward,
    'remaining_slots', v_max_referrals - v_referral_count - 1
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Vous avez déjà été parrainé'
    );
  WHEN OTHERS THEN
    RAISE NOTICE 'apply_referral_code: Erreur - %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Erreur lors de l''application du code'
    );
END;
$$;

-- Créer une fonction pour valider un code de parrainage (avant inscription)
CREATE OR REPLACE FUNCTION public.validate_referral_code(
  p_referral_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_referral_count integer;
  v_referrer_name text;
  v_max_referrals integer := 20;
  v_remaining_slots integer;
BEGIN
  -- Validation du code
  IF p_referral_code IS NULL OR length(trim(p_referral_code)) < 4 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Code invalide'
    );
  END IF;

  -- Rechercher le parrain par son code
  SELECT user_id INTO v_referrer_id
  FROM public.user_referral_codes
  WHERE referral_code = upper(trim(p_referral_code))
    AND is_active = true;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Code introuvable'
    );
  END IF;

  -- Compter les filleuls actuels
  SELECT COUNT(*) INTO v_referral_count
  FROM public.referral_system
  WHERE referrer_id = v_referrer_id;

  v_remaining_slots := v_max_referrals - v_referral_count;

  IF v_remaining_slots <= 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Limite de parrainage atteinte',
      'limit_reached', true
    );
  END IF;

  -- Récupérer le nom du parrain
  SELECT COALESCE(display_name, 'Ami Kwenda') INTO v_referrer_name
  FROM public.clients
  WHERE user_id = v_referrer_id
  LIMIT 1;

  IF v_referrer_name IS NULL THEN
    SELECT COALESCE(display_name, 'Ami Kwenda') INTO v_referrer_name
    FROM public.chauffeurs
    WHERE user_id = v_referrer_id
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'referrer_name', COALESCE(v_referrer_name, 'Ami Kwenda'),
    'remaining_slots', v_remaining_slots,
    'reward_amount', 500
  );
END;
$$;