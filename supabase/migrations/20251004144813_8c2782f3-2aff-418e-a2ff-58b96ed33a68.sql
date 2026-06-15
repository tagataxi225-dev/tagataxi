-- ============================================
-- PHASE 1: Consolidation Système de Parrainage
-- ============================================

-- 1.1 Ajouter contraintes d'unicité sur les codes de parrainage
ALTER TABLE public.referrals 
ADD CONSTRAINT unique_referral_code UNIQUE(referral_code);

ALTER TABLE public.driver_codes 
ADD CONSTRAINT unique_driver_code UNIQUE(code);

-- 1.2 Créer index pour performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_driver_codes_driver_id ON public.driver_codes(driver_id);

-- 1.3 Limiter un seul code actif par driver
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_driver_code 
ON public.driver_codes(driver_id) 
WHERE is_active = true;

-- 1.4 Fonction pour générer un code de parrainage unique
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Générer code format KWENDA + 6 caractères alphanumériques
    v_code := 'KWENDA' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    
    -- Vérifier unicité
    SELECT EXISTS(SELECT 1 FROM referrals WHERE referral_code = v_code) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$;

-- 1.5 RPC sécurisée pour obtenir ou créer un code de parrainage
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_user_type TEXT;
BEGIN
  -- Vérifier que l'utilisateur appelant est bien celui demandé
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: Cannot generate code for another user';
  END IF;

  -- Chercher code existant
  SELECT referral_code INTO v_code
  FROM public.referrals
  WHERE referrer_id = p_user_id
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
    
    -- Insérer le nouveau code
    INSERT INTO public.referrals (
      referrer_id,
      referral_code,
      status,
      user_type,
      reward_amount,
      reward_currency
    ) VALUES (
      p_user_id,
      v_code,
      'active',
      v_user_type,
      CASE v_user_type
        WHEN 'driver' THEN 10000
        WHEN 'partner' THEN 15000
        ELSE 5000
      END,
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

-- ============================================
-- PHASE 2: Compensation Promo Automatique
-- ============================================

-- 2.1 Fonction pour appeler l'edge function de compensation
CREATE OR REPLACE FUNCTION public.auto_credit_promo_compensation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo_used BOOLEAN;
  v_promo_id UUID;
BEGIN
  -- Vérifier que la commande est complétée et qu'un chauffeur est assigné
  IF NEW.status = 'completed' AND NEW.driver_id IS NOT NULL AND OLD.status != 'completed' THEN
    
    -- Vérifier si un promo a été utilisé pour cette commande
    SELECT 
      COUNT(*) > 0,
      MAX(promo_code_id)
    INTO v_promo_used, v_promo_id
    FROM public.promo_code_usage
    WHERE (
      (TG_TABLE_NAME = 'transport_bookings' AND booking_id = NEW.id) OR
      (TG_TABLE_NAME = 'delivery_orders' AND delivery_id = NEW.id)
    );
    
    -- Si promo utilisé, vérifier compensation chauffeur
    IF v_promo_used AND v_promo_id IS NOT NULL THEN
      
      -- Vérifier si compensation existe déjà
      IF NOT EXISTS(
        SELECT 1 FROM public.promo_driver_compensations 
        WHERE driver_id = NEW.driver_id 
        AND promo_code_id = v_promo_id
        AND (
          (TG_TABLE_NAME = 'transport_bookings' AND booking_id = NEW.id) OR
          (TG_TABLE_NAME = 'delivery_orders' AND delivery_id = NEW.id)
        )
      ) THEN
        
        -- Insérer compensation (sera traitée par edge function)
        INSERT INTO public.promo_driver_compensations (
          driver_id,
          promo_code_id,
          booking_id,
          delivery_id,
          status,
          compensation_metadata
        ) VALUES (
          NEW.driver_id,
          v_promo_id,
          CASE WHEN TG_TABLE_NAME = 'transport_bookings' THEN NEW.id ELSE NULL END,
          CASE WHEN TG_TABLE_NAME = 'delivery_orders' THEN NEW.id ELSE NULL END,
          'pending',
          jsonb_build_object(
            'order_type', TG_TABLE_NAME,
            'completed_at', NEW.updated_at
          )
        );
        
        -- Logger
        INSERT INTO public.activity_logs (
          user_id,
          activity_type,
          description,
          metadata
        ) VALUES (
          NEW.driver_id,
          'promo_compensation_pending',
          'Compensation promo en attente de traitement',
          jsonb_build_object(
            'promo_id', v_promo_id,
            'order_type', TG_TABLE_NAME,
            'order_id', NEW.id
          )
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2.2 Appliquer les triggers sur les tables de commandes
DROP TRIGGER IF EXISTS trigger_auto_credit_transport_promo ON public.transport_bookings;
CREATE TRIGGER trigger_auto_credit_transport_promo
AFTER UPDATE ON public.transport_bookings
FOR EACH ROW 
EXECUTE FUNCTION public.auto_credit_promo_compensation();

DROP TRIGGER IF EXISTS trigger_auto_credit_delivery_promo ON public.delivery_orders;
CREATE TRIGGER trigger_auto_credit_delivery_promo
AFTER UPDATE ON public.delivery_orders
FOR EACH ROW 
EXECUTE FUNCTION public.auto_credit_promo_compensation();

-- 2.3 Créer table de rate limiting pour génération de codes
CREATE TABLE IF NOT EXISTS public.code_generation_rate_limit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_type TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_code_rate_limit_user 
ON public.code_generation_rate_limit(user_id, code_type, generated_at);

ALTER TABLE public.code_generation_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits"
ON public.code_generation_rate_limit
FOR SELECT
USING (auth.uid() = user_id);

-- 2.4 Fonction pour vérifier le rate limit
CREATE OR REPLACE FUNCTION public.check_code_generation_rate_limit(
  p_user_id UUID,
  p_code_type TEXT,
  p_max_per_day INTEGER DEFAULT 3
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.code_generation_rate_limit
  WHERE user_id = p_user_id
    AND code_type = p_code_type
    AND generated_at > now() - interval '24 hours';
  
  IF v_count >= p_max_per_day THEN
    RETURN FALSE;
  END IF;
  
  -- Enregistrer cette tentative
  INSERT INTO public.code_generation_rate_limit (user_id, code_type)
  VALUES (p_user_id, p_code_type);
  
  RETURN TRUE;
END;
$$;

-- Nettoyage automatique des anciennes entrées (> 7 jours)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.code_generation_rate_limit
  WHERE generated_at < now() - interval '7 days';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;