-- ============================================
-- PHASE 2: Système de commission automatique vendeur (5%)
-- ============================================

-- 1. Table de configuration des commissions
CREATE TABLE IF NOT EXISTS public.marketplace_commission_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL DEFAULT 'marketplace',
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  fixed_fee NUMERIC(10,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CDF',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_commission_rate CHECK (commission_rate >= 0 AND commission_rate <= 100)
);

-- Enable RLS
ALTER TABLE public.marketplace_commission_config ENABLE ROW LEVEL SECURITY;

-- Policies pour marketplace_commission_config
CREATE POLICY "Anyone can view active commission rates" 
ON public.marketplace_commission_config 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only admins can manage commission config" 
ON public.marketplace_commission_config 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Index
CREATE INDEX idx_marketplace_commission_active ON public.marketplace_commission_config(is_active, service_type);

-- Trigger updated_at
CREATE TRIGGER update_marketplace_commission_config_updated_at
BEFORE UPDATE ON public.marketplace_commission_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default commission rate
INSERT INTO public.marketplace_commission_config (service_type, commission_rate, currency)
VALUES ('marketplace', 5.00, 'CDF')
ON CONFLICT DO NOTHING;

-- 2. Ajouter les colonnes de commission à vendor_earnings
ALTER TABLE public.vendor_earnings 
ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS commission_deducted NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_fees NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount NUMERIC(10,2);

-- 3. Fonction pour calculer la commission
CREATE OR REPLACE FUNCTION public.calculate_marketplace_commission(
  p_gross_amount NUMERIC,
  p_service_type TEXT DEFAULT 'marketplace'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission_rate NUMERIC;
  v_fixed_fee NUMERIC;
  v_commission_amount NUMERIC;
  v_net_amount NUMERIC;
BEGIN
  -- Récupérer le taux de commission actif
  SELECT commission_rate, COALESCE(fixed_fee, 0)
  INTO v_commission_rate, v_fixed_fee
  FROM public.marketplace_commission_config
  WHERE service_type = p_service_type 
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- Si aucune config trouvée, utiliser 5% par défaut
  IF v_commission_rate IS NULL THEN
    v_commission_rate := 5.00;
    v_fixed_fee := 0;
  END IF;

  -- Calculer la commission
  v_commission_amount := ROUND((p_gross_amount * v_commission_rate / 100) + v_fixed_fee, 2);
  v_net_amount := ROUND(p_gross_amount - v_commission_amount, 2);

  RETURN jsonb_build_object(
    'gross_amount', p_gross_amount,
    'commission_rate', v_commission_rate,
    'commission_deducted', v_commission_amount,
    'platform_fees', v_fixed_fee,
    'net_amount', v_net_amount
  );
END;
$$;

-- 4. Trigger pour calculer automatiquement la commission sur marketplace_orders
CREATE OR REPLACE FUNCTION public.auto_calculate_vendor_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission_data JSONB;
  v_existing_earning UUID;
BEGIN
  -- Uniquement si la commande passe à 'completed' ou 'delivered'
  IF NEW.status IN ('completed', 'delivered') AND 
     (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'delivered')) THEN
    
    -- Calculer la commission
    v_commission_data := public.calculate_marketplace_commission(NEW.total_amount, 'marketplace');
    
    -- Vérifier si un earning existe déjà pour cette commande
    SELECT id INTO v_existing_earning
    FROM public.vendor_earnings
    WHERE order_id = NEW.id;
    
    IF v_existing_earning IS NULL THEN
      -- Créer un nouveau vendor_earning avec commission déduite
      INSERT INTO public.vendor_earnings (
        vendor_id,
        order_id,
        gross_amount,
        commission_rate,
        commission_deducted,
        platform_fees,
        net_amount,
        amount,
        earnings_type,
        status,
        currency
      ) VALUES (
        NEW.seller_id,
        NEW.id,
        (v_commission_data->>'gross_amount')::NUMERIC,
        (v_commission_data->>'commission_rate')::NUMERIC,
        (v_commission_data->>'commission_deducted')::NUMERIC,
        (v_commission_data->>'platform_fees')::NUMERIC,
        (v_commission_data->>'net_amount')::NUMERIC,
        (v_commission_data->>'net_amount')::NUMERIC, -- amount = net_amount
        'marketplace_sale',
        'pending',
        'CDF'
      );
    ELSE
      -- Mettre à jour l'earning existant
      UPDATE public.vendor_earnings
      SET 
        gross_amount = (v_commission_data->>'gross_amount')::NUMERIC,
        commission_rate = (v_commission_data->>'commission_rate')::NUMERIC,
        commission_deducted = (v_commission_data->>'commission_deducted')::NUMERIC,
        platform_fees = (v_commission_data->>'platform_fees')::NUMERIC,
        net_amount = (v_commission_data->>'net_amount')::NUMERIC,
        amount = (v_commission_data->>'net_amount')::NUMERIC,
        updated_at = NOW()
      WHERE id = v_existing_earning;
    END IF;
    
    -- Logger l'action
    INSERT INTO public.activity_logs (
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      NEW.seller_id,
      'vendor_commission_calculated',
      format('Commission calculée pour commande %s', NEW.id),
      jsonb_build_object(
        'order_id', NEW.id,
        'commission_data', v_commission_data
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_auto_calculate_vendor_commission ON public.marketplace_orders;
CREATE TRIGGER trigger_auto_calculate_vendor_commission
  AFTER UPDATE OF status ON public.marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_calculate_vendor_commission();

-- 5. Fonction RPC pour retrait vendeur sécurisé
CREATE OR REPLACE FUNCTION public.request_vendor_withdrawal(
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_payment_details JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available_balance NUMERIC;
  v_withdrawal_id UUID;
  v_vendor_id UUID;
  v_withdrawal_fees NUMERIC := 0;
  v_net_amount NUMERIC;
BEGIN
  -- Récupérer le vendor_id de l'utilisateur authentifié
  SELECT user_id INTO v_vendor_id
  FROM public.seller_profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_vendor_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Profil vendeur non trouvé'
    );
  END IF;

  -- Calculer le solde disponible (net_amount des earnings 'pending')
  SELECT COALESCE(SUM(net_amount), 0) INTO v_available_balance
  FROM public.vendor_earnings
  WHERE vendor_id = v_vendor_id
    AND status = 'pending';

  -- Vérifications
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Montant invalide');
  END IF;

  IF p_amount > v_available_balance THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Solde insuffisant. Disponible: %s CDF', v_available_balance)
    );
  END IF;

  -- Calculer les frais de retrait (par exemple 1% avec minimum 500 CDF)
  v_withdrawal_fees := GREATEST(ROUND(p_amount * 0.01, 2), 500);
  v_net_amount := p_amount - v_withdrawal_fees;

  -- Créer la demande de retrait
  INSERT INTO public.vendor_withdrawals (
    vendor_id,
    amount,
    payment_method,
    payment_details,
    fees,
    net_amount,
    status,
    requested_at
  ) VALUES (
    v_vendor_id,
    p_amount,
    p_payment_method,
    p_payment_details,
    v_withdrawal_fees,
    v_net_amount,
    'pending',
    NOW()
  )
  RETURNING id INTO v_withdrawal_id;

  -- Marquer les earnings comme 'withdrawn'
  UPDATE public.vendor_earnings
  SET 
    status = 'processing',
    updated_at = NOW()
  WHERE vendor_id = v_vendor_id
    AND status = 'pending';

  -- Logger l'action
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    v_vendor_id,
    'vendor_withdrawal_requested',
    format('Demande de retrait de %s CDF', p_amount),
    jsonb_build_object(
      'withdrawal_id', v_withdrawal_id,
      'amount', p_amount,
      'fees', v_withdrawal_fees,
      'net_amount', v_net_amount,
      'payment_method', p_payment_method
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'amount', p_amount,
    'fees', v_withdrawal_fees,
    'net_amount', v_net_amount,
    'message', 'Demande de retrait créée avec succès'
  );
END;
$$;

-- 6. Fonction pour obtenir les statistiques vendeur avec commission
CREATE OR REPLACE FUNCTION public.get_vendor_earnings_stats(p_vendor_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_gross NUMERIC;
  v_total_commission NUMERIC;
  v_total_net NUMERIC;
  v_available_balance NUMERIC;
  v_pending_withdrawal NUMERIC;
BEGIN
  -- Vérifier que l'appelant est le vendeur ou un admin
  IF NOT (auth.uid() = p_vendor_id OR is_current_user_admin()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Accès refusé');
  END IF;

  -- Calculer les statistiques
  SELECT 
    COALESCE(SUM(gross_amount), 0),
    COALESCE(SUM(commission_deducted), 0),
    COALESCE(SUM(net_amount), 0),
    COALESCE(SUM(CASE WHEN status = 'pending' THEN net_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'processing' THEN net_amount ELSE 0 END), 0)
  INTO 
    v_total_gross,
    v_total_commission,
    v_total_net,
    v_available_balance,
    v_pending_withdrawal
  FROM public.vendor_earnings
  WHERE vendor_id = p_vendor_id;

  RETURN jsonb_build_object(
    'success', true,
    'total_gross_earnings', v_total_gross,
    'total_commission_deducted', v_total_commission,
    'total_net_earnings', v_total_net,
    'available_balance', v_available_balance,
    'pending_withdrawal', v_pending_withdrawal,
    'currency', 'CDF'
  );
END;
$$;