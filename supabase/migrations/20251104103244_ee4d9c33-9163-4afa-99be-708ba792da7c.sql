-- Migration: Ajouter les transferts dans wallet_transactions pour affichage dans l'historique
-- Date: 2025-11-04

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

  -- 6. Logger les transactions dans activity_logs
  INSERT INTO public.activity_logs (
    user_id, activity_type, description, 
    amount, currency, reference_type, reference_id
  ) VALUES
    (p_sender_id, 'transfer_sent', p_description, 
     -p_amount, 'CDF', 'wallet_transfer', v_transfer_id),
    (p_recipient_id, 'transfer_received', p_description, 
     p_amount, 'CDF', 'wallet_transfer', v_transfer_id);

  -- 6.5. NOUVEAU: Enregistrer dans wallet_transactions pour affichage dans l'historique
  INSERT INTO public.wallet_transactions (
    user_id, wallet_id, transaction_type, amount, currency,
    description, status, balance_before, balance_after,
    reference_type, reference_id
  ) VALUES
    -- Transaction pour l'expéditeur (débit)
    (p_sender_id, v_sender_wallet.id, 'transfer_out', -p_amount, 'CDF',
     p_description, 'completed', v_sender_wallet.balance, v_sender_new_balance,
     'wallet_transfer', v_transfer_id),
    -- Transaction pour le destinataire (crédit)
    (p_recipient_id, v_recipient_wallet.id, 'transfer_in', p_amount, 'CDF',
     p_description, 'completed', v_recipient_wallet.balance, v_recipient_new_balance,
     'wallet_transfer', v_transfer_id);

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