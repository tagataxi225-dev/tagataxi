-- 1. Créer une table dédiée pour les codes de parrainage utilisateur
CREATE TABLE IF NOT EXISTS public.user_referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Activer RLS sur la nouvelle table
ALTER TABLE public.user_referral_codes ENABLE ROW LEVEL SECURITY;

-- 3. Policies pour user_referral_codes
CREATE POLICY "Users can view their own referral code"
ON public.user_referral_codes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral code"
ON public.user_referral_codes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Ajouter bonus_balance à user_wallets si pas déjà fait
ALTER TABLE public.user_wallets 
ADD COLUMN IF NOT EXISTS bonus_balance NUMERIC DEFAULT 0.00;

-- 5. Modifier les montants de récompense par défaut dans referral_system
ALTER TABLE public.referral_system 
ALTER COLUMN referrer_reward_amount SET DEFAULT 500,
ALTER COLUMN referee_reward_amount SET DEFAULT 500;

-- 6. Fonction pour générer un code unique
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
  v_attempts INT := 0;
  v_max_attempts INT := 10;
BEGIN
  LOOP
    -- Générer un code de 8 caractères alphanumériques
    v_code := 'KW' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    
    -- Vérifier si le code existe déjà
    SELECT EXISTS(
      SELECT 1 FROM public.user_referral_codes WHERE referral_code = v_code
      UNION
      SELECT 1 FROM public.referral_system WHERE referral_code = v_code
    ) INTO v_exists;
    
    -- Si le code n'existe pas, le retourner
    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
    
    -- Incrémenter le compteur de tentatives
    v_attempts := v_attempts + 1;
    
    -- Sortir après trop de tentatives
    IF v_attempts >= v_max_attempts THEN
      RAISE EXCEPTION 'Impossible de générer un code unique après % tentatives', v_max_attempts;
    END IF;
  END LOOP;
END;
$$;

-- 7. Remplacer la RPC get_or_create_referral_code (VERSION CORRIGÉE)
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Vérifier que l'utilisateur appelant est bien celui demandé
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: Cannot generate code for another user';
  END IF;

  -- Chercher code existant dans user_referral_codes
  SELECT referral_code INTO v_code
  FROM public.user_referral_codes
  WHERE user_id = p_user_id;
  
  -- Si aucun code trouvé, en créer un nouveau
  IF v_code IS NULL THEN
    v_code := public.generate_unique_referral_code();
    
    -- Insérer le nouveau code dans user_referral_codes
    INSERT INTO public.user_referral_codes (
      user_id,
      referral_code
    ) VALUES (
      p_user_id,
      v_code
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
      jsonb_build_object('code', v_code)
    );
  END IF;
  
  RETURN v_code;
END;
$$;

-- 8. Remplacer la fonction apply_referral_code (VERSION CORRIGÉE)
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
BEGIN
  -- Vérifier que l'utilisateur appelant est bien le filleul
  IF auth.uid() != p_referee_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Access denied'
    );
  END IF;

  -- Chercher le parrain dans user_referral_codes
  SELECT user_id INTO v_referrer_id
  FROM public.user_referral_codes
  WHERE referral_code = UPPER(p_referral_code);

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
    UPPER(p_referral_code),
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
  WHERE user_id = v_referrer_id;

  -- Créditer le FILLEUL : +500 CDF dans bonus_balance
  UPDATE public.user_wallets
  SET bonus_balance = COALESCE(bonus_balance, 0) + 500,
      updated_at = NOW()
  WHERE user_id = p_referee_id;

  -- Logger les crédits
  INSERT INTO public.activity_logs (user_id, activity_type, description, amount, currency)
  VALUES 
    (v_referrer_id, 'referral_bonus', 'Bonus parrainage - Nouveau filleul', 500, 'CDF'),
    (p_referee_id, 'referral_bonus', 'Bonus parrainage - Code utilisé', 500, 'CDF');

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Code de parrainage appliqué avec succès',
    'referrer_id', v_referrer_id,
    'bonus_amount', 500
  );
END;
$$;