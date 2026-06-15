
-- ============================================
-- MIGRATION: Système de Parrainage Unifié
-- ============================================
-- Ajoute bonus_balance, fixe les montants à 500 CDF,
-- et crée les RPC sécurisées pour gérer les parrainages

-- 1. Ajouter bonus_balance à user_wallets
ALTER TABLE public.user_wallets 
ADD COLUMN IF NOT EXISTS bonus_balance NUMERIC DEFAULT 0.00;

COMMENT ON COLUMN public.user_wallets.bonus_balance IS 
'Solde bonus provenant des parrainages, utilisable uniquement si couvre 100% du montant';

-- 2. Index pour optimiser les requêtes sur bonus_balance
CREATE INDEX IF NOT EXISTS idx_user_wallets_bonus_balance 
ON public.user_wallets(bonus_balance) WHERE bonus_balance > 0;

-- 3. Fonction pour générer un code de parrainage unique
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Générer code format: KWENDA + 6 caractères aléatoires
    v_code := 'KWENDA' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    -- Vérifier unicité
    SELECT EXISTS(
      SELECT 1 FROM public.referral_system
      WHERE referral_code = v_code
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$;

-- 4. RPC pour obtenir ou créer le code de parrainage d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code TEXT;
  v_user_type TEXT;
BEGIN
  -- Sécurité: Vérifier que l'utilisateur appelant est bien celui demandé
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: Cannot generate code for another user';
  END IF;

  -- Chercher code existant dans referral_system
  SELECT referral_code INTO v_code
  FROM public.referral_system
  WHERE referrer_id = p_user_id
  AND status = 'active'
  LIMIT 1;
  
  -- Si aucun code trouvé, en créer un nouveau
  IF v_code IS NULL THEN
    v_code := public.generate_unique_referral_code();
    
    -- Déterminer le type d'utilisateur
    SELECT 
      CASE 
        WHEN EXISTS(SELECT 1 FROM chauffeurs WHERE user_id = p_user_id) THEN 'driver'
        WHEN EXISTS(SELECT 1 FROM partenaires WHERE user_id = p_user_id) THEN 'partner'
        ELSE 'client'
      END INTO v_user_type;
    
    -- Insérer le nouveau code dans referral_system
    INSERT INTO public.referral_system (
      referrer_id,
      referee_id,
      referral_code,
      status,
      referrer_reward_amount,
      referee_reward_amount,
      currency
    ) VALUES (
      p_user_id,
      p_user_id, -- Temporaire, sera mis à jour lors de l'utilisation
      v_code,
      'active',
      500, -- Montant fixe 500 CDF
      500, -- Montant fixe 500 CDF
      'CDF'
    );
    
    -- Logger l'activité
    INSERT INTO public.activity_logs (
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      p_user_id,
      'referral_code_created',
      'Code de parrainage créé',
      jsonb_build_object('code', v_code, 'user_type', v_user_type)
    );
  END IF;
  
  RETURN v_code;
END;
$$;

-- 5. RPC pour valider et appliquer un code de parrainage
CREATE OR REPLACE FUNCTION public.apply_referral_code(
  p_referee_id UUID,
  p_referral_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_id UUID;
  v_already_used BOOLEAN;
  v_referrer_bonus NUMERIC;
  v_referee_bonus NUMERIC;
BEGIN
  -- Sécurité: Vérifier que l'utilisateur appelant est bien le filleul
  IF auth.uid() != p_referee_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Access denied'
    );
  END IF;

  -- Chercher le parrain
  SELECT referrer_id INTO v_referrer_id
  FROM public.referral_system
  WHERE referral_code = UPPER(TRIM(p_referral_code))
  AND status = 'active'
  LIMIT 1;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Code de parrainage invalide'
    );
  END IF;

  -- Vérifier auto-parrainage
  IF v_referrer_id = p_referee_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Vous ne pouvez pas utiliser votre propre code'
    );
  END IF;

  -- Vérifier si déjà utilisé un code
  SELECT EXISTS(
    SELECT 1 FROM public.referral_system
    WHERE referee_id = p_referee_id
    AND status = 'completed'
  ) INTO v_already_used;

  IF v_already_used THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Vous avez déjà utilisé un code de parrainage'
    );
  END IF;

  -- Créer l'enregistrement de parrainage
  INSERT INTO public.referral_system (
    referrer_id,
    referee_id,
    referral_code,
    status,
    referrer_reward_amount,
    referee_reward_amount,
    currency,
    completed_at,
    rewarded_at
  ) VALUES (
    v_referrer_id,
    p_referee_id,
    UPPER(TRIM(p_referral_code)),
    'completed',
    500,
    500,
    'CDF',
    NOW(),
    NOW()
  );

  -- Créditer le PARRAIN : +500 CDF dans bonus_balance
  UPDATE public.user_wallets
  SET bonus_balance = COALESCE(bonus_balance, 0) + 500,
      updated_at = NOW()
  WHERE user_id = v_referrer_id
  RETURNING COALESCE(bonus_balance, 0) INTO v_referrer_bonus;

  -- Créditer le FILLEUL : +500 CDF dans bonus_balance
  UPDATE public.user_wallets
  SET bonus_balance = COALESCE(bonus_balance, 0) + 500,
      updated_at = NOW()
  WHERE user_id = p_referee_id
  RETURNING COALESCE(bonus_balance, 0) INTO v_referee_bonus;

  -- Logger les crédits
  INSERT INTO public.activity_logs (user_id, activity_type, description, amount, currency, reference_type, reference_id)
  VALUES 
    (v_referrer_id, 'referral_bonus', 'Bonus parrainage - Nouveau filleul inscrit', 500, 'CDF', 'referral', p_referee_id::TEXT),
    (p_referee_id, 'referral_bonus', 'Bonus parrainage - Code utilisé', 500, 'CDF', 'referral', v_referrer_id::TEXT);

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Code de parrainage appliqué avec succès',
    'referrer_id', v_referrer_id,
    'referee_id', p_referee_id,
    'bonus_amount', 500,
    'referrer_new_bonus', v_referrer_bonus,
    'referee_new_bonus', v_referee_bonus
  );
END;
$$;

-- 6. Permissions d'exécution
GRANT EXECUTE ON FUNCTION public.generate_unique_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_referral_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_referral_code(UUID, TEXT) TO authenticated;

-- 7. Commentaires pour documentation
COMMENT ON FUNCTION public.get_or_create_referral_code IS 
'Obtient le code de parrainage existant ou en crée un nouveau. Sécurisé: auth.uid() = p_user_id';

COMMENT ON FUNCTION public.apply_referral_code IS 
'Valide et applique un code de parrainage. Crédite 500 CDF dans bonus_balance pour parrain et filleul';
