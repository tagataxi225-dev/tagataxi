-- ✅ Table codes de parrainage chauffeurs
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  service_type TEXT NOT NULL CHECK (service_type IN ('taxi', 'delivery', 'both')),
  
  -- Stats d'utilisation
  usage_count INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  
  -- Bonus
  bonus_per_referral DECIMAL(10, 2) DEFAULT 5000, -- Bonus pour le parrain
  referred_bonus DECIMAL(10, 2) DEFAULT 3000, -- Bonus pour le filleul
  
  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ✅ Table tracking des parrainages
CREATE TABLE IF NOT EXISTS public.referral_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  
  -- Bonus versés
  referrer_bonus_paid BOOLEAN DEFAULT false,
  referred_bonus_paid BOOLEAN DEFAULT false,
  referrer_bonus_amount DECIMAL(10, 2) DEFAULT 0,
  referred_bonus_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- Conditions de validation
  referred_completed_rides INTEGER DEFAULT 0,
  validation_threshold INTEGER DEFAULT 10, -- Nombre de courses pour valider le parrainage
  
  -- Dates
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '90 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Contrainte : un utilisateur ne peut être parrainé qu'une seule fois
  UNIQUE(referred_id)
);

-- ✅ Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer ON referral_tracking(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referred ON referral_tracking(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_status ON referral_tracking(status);

-- ✅ Fonction pour générer un code unique
CREATE OR REPLACE FUNCTION generate_driver_referral_code(p_user_id UUID, p_service_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_prefix TEXT;
  v_random TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Préfixe selon le type de service
  v_prefix := CASE 
    WHEN p_service_type = 'taxi' THEN 'TAXI'
    WHEN p_service_type = 'delivery' THEN 'DELIV'
    ELSE 'DRIVE'
  END;
  
  -- Générer code unique
  LOOP
    v_random := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || p_user_id::TEXT) FROM 1 FOR 6));
    v_code := v_prefix || '-' || v_random;
    
    -- Vérifier unicité
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$;

-- ✅ Trigger pour créer automatiquement un code lors de l'inscription chauffeur
CREATE OR REPLACE FUNCTION auto_create_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Générer code de parrainage
  v_code := generate_driver_referral_code(NEW.user_id, NEW.service_type);
  
  -- Insérer dans referral_codes
  INSERT INTO referral_codes (user_id, code, service_type)
  VALUES (NEW.user_id, v_code, NEW.service_type)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Attacher le trigger à la table chauffeurs
DROP TRIGGER IF EXISTS trigger_auto_referral_code ON chauffeurs;
CREATE TRIGGER trigger_auto_referral_code
  AFTER INSERT ON chauffeurs
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_referral_code();

-- ✅ Fonction pour utiliser un code de parrainage
CREATE OR REPLACE FUNCTION use_referral_code(p_code TEXT, p_referred_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_code_id UUID;
  v_referrer_id UUID;
  v_tracking_id UUID;
  v_bonus_referrer DECIMAL(10, 2);
  v_bonus_referred DECIMAL(10, 2);
BEGIN
  -- Vérifier que le code existe et est actif
  SELECT id, user_id, bonus_per_referral, referred_bonus
  INTO v_referral_code_id, v_referrer_id, v_bonus_referrer, v_bonus_referred
  FROM referral_codes
  WHERE code = p_code 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code invalide ou expiré');
  END IF;
  
  -- Vérifier que le filleul n'est pas déjà parrainé
  IF EXISTS(SELECT 1 FROM referral_tracking WHERE referred_id = p_referred_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vous avez déjà été parrainé');
  END IF;
  
  -- Vérifier que le parrain ne se parraine pas lui-même
  IF v_referrer_id = p_referred_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vous ne pouvez pas utiliser votre propre code');
  END IF;
  
  -- Créer le tracking
  INSERT INTO referral_tracking (
    referral_code_id,
    referrer_id,
    referred_id,
    referrer_bonus_amount,
    referred_bonus_amount
  )
  VALUES (
    v_referral_code_id,
    v_referrer_id,
    p_referred_id,
    v_bonus_referrer,
    v_bonus_referred
  )
  RETURNING id INTO v_tracking_id;
  
  -- Incrémenter le compteur d'utilisation
  UPDATE referral_codes
  SET usage_count = usage_count + 1,
      updated_at = now()
  WHERE id = v_referral_code_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tracking_id', v_tracking_id,
    'bonus_amount', v_bonus_referred
  );
END;
$$;

-- ✅ RLS Policies
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;

-- Chauffeurs peuvent voir et gérer leur propre code
CREATE POLICY "Drivers can view their own referral code"
ON referral_codes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Drivers can update their own referral code"
ON referral_codes FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Tout le monde peut voir les codes actifs (pour validation)
CREATE POLICY "Anyone can view active referral codes"
ON referral_codes FOR SELECT
TO authenticated
USING (is_active = true);

-- Tracking visible par le parrain et le filleul
CREATE POLICY "Users can view their referral tracking"
ON referral_tracking FOR SELECT
TO authenticated
USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- Admins full access
CREATE POLICY "Admins can manage all referral codes"
ON referral_codes FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can manage all referral tracking"
ON referral_tracking FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);