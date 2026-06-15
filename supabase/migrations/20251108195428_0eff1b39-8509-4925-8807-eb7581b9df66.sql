-- ============================================================================
-- 🔧 CORRECTION FONCTION execute_wallet_transfer - Ajout colonnes manquantes
-- Date: 2025-11-08
-- Problème: sender_balance_before/after NOT NULL mais pas remplis dans INSERT
-- Solution: Ajouter toutes les colonnes requises dans wallet_transfers
-- ============================================================================

CREATE OR REPLACE FUNCTION public.execute_wallet_transfer(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT NULL
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
  v_recipient_name TEXT;
  v_sender_name TEXT;
BEGIN
  -- Validation des paramètres
  IF p_sender_id IS NULL OR p_recipient_id IS NULL THEN
    RAISE EXCEPTION 'sender_id et recipient_id sont requis';
  END IF;

  IF p_sender_id = p_recipient_id THEN
    RAISE EXCEPTION 'Impossible de transférer vers soi-même';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Le montant doit être positif';
  END IF;

  -- Récupérer les wallets avec verrouillage
  SELECT * INTO v_sender_wallet
  FROM public.user_wallets
  WHERE user_id = p_sender_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet expéditeur introuvable';
  END IF;

  SELECT * INTO v_recipient_wallet
  FROM public.user_wallets
  WHERE user_id = p_recipient_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet destinataire introuvable';
  END IF;

  -- Vérifier le solde
  IF v_sender_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'Solde insuffisant';
  END IF;

  -- Générer l'ID du transfert
  v_transfer_id := gen_random_uuid();

  -- Calculer les nouveaux soldes
  v_sender_new_balance := v_sender_wallet.balance - p_amount;
  v_recipient_new_balance := v_recipient_wallet.balance + p_amount;

  -- ✅ Récupérer les noms avec la fonction utilitaire
  v_recipient_name := get_user_display_name(p_recipient_id);
  v_sender_name := get_user_display_name(p_sender_id);

  -- Mettre à jour les balances
  UPDATE public.user_wallets
  SET balance = v_sender_new_balance, updated_at = now()
  WHERE user_id = p_sender_id;

  UPDATE public.user_wallets
  SET balance = v_recipient_new_balance, updated_at = now()
  WHERE user_id = p_recipient_id;

  -- ✅ Créer l'entrée dans wallet_transfers AVEC TOUTES LES COLONNES REQUISES
  INSERT INTO public.wallet_transfers (
    id, 
    sender_id, 
    recipient_id, 
    amount, 
    currency,
    description, 
    status, 
    sender_balance_before,
    sender_balance_after,
    recipient_balance_before,
    recipient_balance_after,
    created_at,
    completed_at
  ) VALUES (
    v_transfer_id, 
    p_sender_id, 
    p_recipient_id, 
    p_amount, 
    'CDF',
    COALESCE(p_description, 'Transfert KwendaPay'), 
    'completed',
    v_sender_wallet.balance,
    v_sender_new_balance,
    v_recipient_wallet.balance,
    v_recipient_new_balance,
    now(),
    now()
  );

  -- Enregistrer dans wallet_transactions avec descriptions personnalisées
  INSERT INTO public.wallet_transactions (
    user_id, wallet_id, transaction_type, amount, currency,
    description, status, balance_before, balance_after,
    reference_type, reference_id
  ) VALUES
    -- Transaction pour l'expéditeur (débit)
    (
      p_sender_id, 
      v_sender_wallet.id, 
      'transfer_out', 
      -p_amount, 
      'CDF',
      'Transfert envoyé à ' || v_recipient_name, 
      'completed', 
      v_sender_wallet.balance, 
      v_sender_new_balance,
      'wallet_transfer', 
      v_transfer_id
    ),
    -- Transaction pour le destinataire (crédit)
    (
      p_recipient_id, 
      v_recipient_wallet.id, 
      'transfer_in', 
      p_amount, 
      'CDF',
      'Transfert reçu de ' || v_sender_name, 
      'completed', 
      v_recipient_wallet.balance, 
      v_recipient_new_balance,
      'wallet_transfer', 
      v_transfer_id
    );

  -- Retourner le résultat avec les noms
  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'sender_new_balance', v_sender_new_balance,
    'recipient_new_balance', v_recipient_new_balance,
    'recipient_name', v_recipient_name,
    'sender_name', v_sender_name
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur lors du transfert: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.execute_wallet_transfer IS 
'Fonction de transfert de fonds entre wallets (CORRIGÉE v2).
✅ Toutes les colonnes NOT NULL de wallet_transfers sont remplies.
✅ Utilise get_user_display_name() pour récupérer les noms correctement.
✅ Descriptions personnalisées avec noms des utilisateurs.
✅ Support tous types de profils: client, partner, driver.';