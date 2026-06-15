-- ============================================
-- SÉCURISATION CODES PROMO ET PARRAINAGE
-- ============================================

-- 1. INDEX UNIQUE: Empêcher usage multiple du même code promo par le même utilisateur
CREATE UNIQUE INDEX IF NOT EXISTS unique_promo_user_usage 
ON promo_code_usage(promo_code_id, user_id);

-- 2. RLS: Les utilisateurs ne voient que leurs propres usages de codes promo
DROP POLICY IF EXISTS "Users can view own promo usage" ON promo_code_usage;
CREATE POLICY "Users can view own promo usage" 
ON promo_code_usage FOR SELECT 
USING (auth.uid() = user_id);

-- 3. INDEX UNIQUE: Empêcher qu'un utilisateur utilise plusieurs codes de parrainage
CREATE UNIQUE INDEX IF NOT EXISTS unique_referee_usage
ON referral_system(referee_id);

-- 4. FONCTION: Empêcher l'auto-parrainage
CREATE OR REPLACE FUNCTION prevent_self_referral()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referrer_id = NEW.referee_id THEN
    RAISE EXCEPTION 'Auto-parrainage interdit: un utilisateur ne peut pas se parrainer lui-même';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. TRIGGER: Vérifier l'auto-parrainage avant insertion
DROP TRIGGER IF EXISTS check_self_referral ON referral_system;
CREATE TRIGGER check_self_referral
  BEFORE INSERT ON referral_system
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_referral();

-- 6. FONCTION: Validation stricte code promo avant usage
CREATE OR REPLACE FUNCTION validate_promo_code_before_use()
RETURNS TRIGGER AS $$
DECLARE
  v_promo RECORD;
  v_usage_count INTEGER;
BEGIN
  -- Récupérer les infos du code promo
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE id = NEW.promo_code_id;

  -- Vérifier que le code est actif
  IF NOT v_promo.is_active THEN
    RAISE EXCEPTION 'Code promo inactif';
  END IF;

  -- Vérifier la date de validité
  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < NOW() THEN
    RAISE EXCEPTION 'Code promo expiré';
  END IF;

  -- Vérifier la limite par utilisateur
  IF v_promo.user_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM promo_code_usage
    WHERE promo_code_id = NEW.promo_code_id
      AND user_id = NEW.user_id;
    
    IF v_usage_count >= v_promo.user_limit THEN
      RAISE EXCEPTION 'Limite d''usage de ce code atteinte pour cet utilisateur';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. TRIGGER: Valider code promo avant insertion dans promo_code_usage
DROP TRIGGER IF EXISTS validate_promo_before_insert ON promo_code_usage;
CREATE TRIGGER validate_promo_before_insert
  BEFORE INSERT ON promo_code_usage
  FOR EACH ROW
  EXECUTE FUNCTION validate_promo_code_before_use();

-- 8. Ajouter commentaires pour documentation
COMMENT ON INDEX unique_promo_user_usage IS 'Empêche un utilisateur d''utiliser plusieurs fois le même code promo';
COMMENT ON INDEX unique_referee_usage IS 'Empêche un utilisateur d''utiliser plusieurs codes de parrainage';
COMMENT ON FUNCTION prevent_self_referral IS 'Empêche l''auto-parrainage (un utilisateur ne peut pas se parrainer lui-même)';
COMMENT ON FUNCTION validate_promo_code_before_use IS 'Valide les conditions du code promo avant enregistrement de l''usage';
