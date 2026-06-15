-- ============================================================================
-- PHASE 1: Table wallet_transfers pour traçabilité des transferts P2P
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wallet_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Participants
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Montants
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'CDF',
  
  -- Statuts
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Métadonnées
  description TEXT,
  sender_balance_before NUMERIC(10,2) NOT NULL,
  sender_balance_after NUMERIC(10,2) NOT NULL,
  recipient_balance_before NUMERIC(10,2),
  recipient_balance_after NUMERIC(10,2),
  
  -- Sécurité
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  
  -- Contraintes de sécurité
  CONSTRAINT no_self_transfer CHECK (sender_id != recipient_id),
  CONSTRAINT positive_amount CHECK (amount >= 100),
  CONSTRAINT max_amount CHECK (amount <= 500000)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_wallet_transfers_sender ON public.wallet_transfers(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transfers_recipient ON public.wallet_transfers(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transfers_status ON public.wallet_transfers(status);

-- Enable RLS
ALTER TABLE public.wallet_transfers ENABLE ROW LEVEL SECURITY;

-- Politiques RLS strictes
CREATE POLICY "Users view own transfers" ON public.wallet_transfers
FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);

CREATE POLICY "Only system can modify transfers" ON public.wallet_transfers
FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Admins view all transfers" ON public.wallet_transfers
FOR SELECT USING (is_current_user_admin());

-- ============================================================================
-- PHASE 2: Fonction RPC atomique pour exécuter les transferts
-- ============================================================================

CREATE OR REPLACE FUNCTION public.execute_wallet_transfer(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_amount NUMERIC,
  p_description TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sender_wallet RECORD;
  v_recipient_wallet RECORD;
  v_transfer_id UUID;
  v_sender_new_balance NUMERIC;
  v_recipient_new_balance NUMERIC;
BEGIN
  -- 1. Récupérer les portefeuilles avec LOCK (évite race conditions)
  SELECT * INTO v_sender_wallet
  FROM public.user_wallets
  WHERE user_id = p_sender_id AND currency = 'CDF'
  FOR UPDATE;

  SELECT * INTO v_recipient_wallet
  FROM public.user_wallets
  WHERE user_id = p_recipient_id AND currency = 'CDF'
  FOR UPDATE;

  -- 2. Vérifications
  IF v_sender_wallet IS NULL THEN
    RAISE EXCEPTION 'Portefeuille expéditeur introuvable';
  END IF;

  IF v_recipient_wallet IS NULL THEN
    RAISE EXCEPTION 'Portefeuille destinataire introuvable';
  END IF;

  IF NOT v_sender_wallet.is_active THEN
    RAISE EXCEPTION 'Votre portefeuille est désactivé';
  END IF;

  IF NOT v_recipient_wallet.is_active THEN
    RAISE EXCEPTION 'Portefeuille destinataire désactivé';
  END IF;

  IF v_sender_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'Solde insuffisant (disponible: % CDF)', v_sender_wallet.balance;
  END IF;

  -- 3. Calculs
  v_sender_new_balance := v_sender_wallet.balance - p_amount;
  v_recipient_new_balance := v_recipient_wallet.balance + p_amount;

  -- 4. Créer le transfert
  INSERT INTO public.wallet_transfers (
    sender_id, recipient_id, amount, currency,
    description, status,
    sender_balance_before, sender_balance_after,
    recipient_balance_before, recipient_balance_after
  ) VALUES (
    p_sender_id, p_recipient_id, p_amount, 'CDF',
    p_description, 'processing',
    v_sender_wallet.balance, v_sender_new_balance,
    v_recipient_wallet.balance, v_recipient_new_balance
  ) RETURNING id INTO v_transfer_id;

  -- 5. Mettre à jour les portefeuilles
  UPDATE public.user_wallets
  SET balance = v_sender_new_balance, updated_at = NOW()
  WHERE id = v_sender_wallet.id;

  UPDATE public.user_wallets
  SET balance = v_recipient_new_balance, updated_at = NOW()
  WHERE id = v_recipient_wallet.id;

  -- 6. Logger les transactions
  INSERT INTO public.activity_logs (
    user_id, activity_type, description, 
    amount, currency, reference_type, reference_id
  ) VALUES
    (p_sender_id, 'transfer_sent', p_description, 
     -p_amount, 'CDF', 'wallet_transfer', v_transfer_id),
    (p_recipient_id, 'transfer_received', p_description, 
     p_amount, 'CDF', 'wallet_transfer', v_transfer_id);

  -- 7. Marquer le transfert comme complété
  UPDATE public.wallet_transfers
  SET status = 'completed', completed_at = NOW()
  WHERE id = v_transfer_id;

  -- 8. Retourner les résultats
  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'sender_new_balance', v_sender_new_balance,
    'recipient_new_balance', v_recipient_new_balance
  );

EXCEPTION WHEN OTHERS THEN
  -- En cas d'erreur, marquer le transfert comme échoué
  IF v_transfer_id IS NOT NULL THEN
    UPDATE public.wallet_transfers
    SET status = 'failed', failed_at = NOW(), failure_reason = SQLERRM
    WHERE id = v_transfer_id;
  END IF;
  
  RAISE;
END;
$$;

-- ============================================================================
-- PHASE 3: Fonctions helper pour déduire les points Kwenda
-- ============================================================================

CREATE OR REPLACE FUNCTION public.deduct_kwenda_points(
  p_user_id UUID,
  p_points INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_wallets
  SET 
    kwenda_points = kwenda_points - p_points,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;